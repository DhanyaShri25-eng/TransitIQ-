/**
 * TransitIQ — Firebase Cloud Functions
 * Automated Real-time Push Notification Dispatcher via Firebase Cloud Messaging (FCM)
 *
 * Triggered automatically when:
 * 1. An ESP32 RFID Reader validates a student tap and writes to Firestore.
 * 2. A valid boarding event is recorded in the 'boarding_records' Firestore collection.
 *
 * Features:
 * - Anti-Duplicate Idempotency via atomic 'fcm_sent_logs'
 * - Student-to-Parent Device Target Resolution (Strict 1-to-1 matching)
 * - Automatic Pruning of expired/invalid FCM tokens
 * - HTTPS Endpoint for ESP32 Wi-Fi HTTP direct ingestion
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Format timestamp into human-readable AM/PM (e.g. "8:15 AM")
 */
function formatNotificationTime(isoOrTimestamp) {
  try {
    const d = isoOrTimestamp ? new Date(isoOrTimestamp) : new Date();
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata' // Default India transport timezone
    });
  } catch (e) {
    return 'just now';
  }
}

/**
 * TRIGGER: Automatically sends push notification to parent when a VALID boarding record is created.
 */
exports.onBoardingRecordCreated = onDocumentCreated(
  {
    document: 'boarding_records/{recordId}',
    region: 'us-central1'
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.info('No data associated with event, skipping.');
      return null;
    }

    const record = snap.data();
    const recordId = event.params.recordId;
    const eventId = record.event_id || recordId;

    logger.info(`Processing boarding record ${recordId} (Event ID: ${eventId}) for student: ${record.student_name}`);

    // 1. Strict Validation Check: Only VALID boarding events trigger parent push notifications
    if (record.verification_status !== 'VALID') {
      logger.info(`Skipping notification: verification status is "${record.verification_status}" (not VALID).`);
      return null;
    }

    // 2. Prevent Duplicate Notifications (Idempotency Guarantee)
    const idempotencyRef = db.collection('fcm_sent_logs').doc(eventId);
    const alreadySentSnap = await idempotencyRef.get();

    if (alreadySentSnap.exists || record.notification_sent === true) {
      logger.warn(`DUPLICATE PREVENTED: Notification for event ${eventId} has already been dispatched.`);
      return null;
    }

    const studentId = record.student_id;
    const studentName = record.student_name || 'Your student';
    const busId = record.bus_id || 'Bus';
    const timestampStr = formatNotificationTime(record.event_timestamp || record.received_timestamp);

    if (!studentId) {
      logger.warn(`Record ${recordId} has no student_id associated; cannot resolve parent device.`);
      return null;
    }

    // 3. Resolve Registered Parent Devices for this Student
    const parentDevicesSnapshot = await db
      .collection('parent_devices')
      .where('student_id', '==', studentId)
      .get();

    if (parentDevicesSnapshot.empty) {
      logger.warn(`No registered parent devices found in Firestore for Student ID: ${studentId} (${studentName}).`);
      
      // Mark record so dashboard knows parent device is pending registration
      await snap.ref.update({
        fcm_status: 'NO_PARENT_DEVICE_REGISTERED',
        fcm_checked_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    // Extract active tokens and document references
    const tokens = [];
    const tokenDocRefs = [];

    parentDevicesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcm_token && typeof data.fcm_token === 'string') {
        tokens.push(data.fcm_token);
        tokenDocRefs.push({ id: doc.id, token: data.fcm_token });
      }
    });

    if (tokens.length === 0) {
      logger.warn(`Parent device records found for ${studentId}, but no valid tokens extracted.`);
      return null;
    }

    logger.info(`Found ${tokens.length} parent device token(s) for Student ${studentName}.`);

    // 4. Construct Notification Payload
    // Title & Message format strictly matching user requirement:
    // Title: TransitIQ – Bus Boarding Alert
    // Message: Your child DHANYA SHRI.A.C has boarded Bus BUS01 at 8:15 AM.
    const notificationTitle = 'TransitIQ – Bus Boarding Alert';
    const notificationBody = `Your child ${studentName} has boarded Bus ${busId} at ${timestampStr}.`;

    const messagePayload = {
      tokens: tokens,
      notification: {
        title: notificationTitle,
        body: notificationBody
      },
      data: {
        event_id: String(eventId),
        student_id: String(studentId),
        student_name: String(studentName),
        bus_number: String(busId),
        boarding_status: 'VALID',
        event_timestamp: String(record.event_timestamp || new Date().toISOString()),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      webpush: {
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `boarding-${eventId}`,
          renotify: true,
          requireInteraction: true
        },
        fcmOptions: {
          link: '/'
        }
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'transitiq_bus_alerts',
          sound: 'default',
          priority: 'max'
        }
      }
    };

    try {
      // 5. Atomic Idempotency Reservation
      await idempotencyRef.set({
        event_id: eventId,
        student_id: studentId,
        student_name: studentName,
        bus_id: busId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        dispatched_to_count: tokens.length
      });

      // 6. Send Push Notification via Firebase Cloud Messaging
      const response = await messaging.sendEachForMulticast(messagePayload);
      logger.info(`FCM multicast dispatch completed: ${response.successCount} succeeded, ${response.failureCount} failed.`);

      // 7. Handle Delivery Errors & Prune Stale/Invalid Tokens
      const staleTokenDocIds = [];

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            logger.warn(`Token index ${idx} failed with error:`, error?.code, error?.message);

            // Clean up defunct or unregistered tokens
            if (
              error?.code === 'messaging/invalid-registration-token' ||
              error?.code === 'messaging/registration-token-not-registered'
            ) {
              staleTokenDocIds.push(tokenDocRefs[idx].id);
            }
          }
        });

        // Prune stale tokens in batch
        if (staleTokenDocIds.length > 0) {
          logger.info(`Pruning ${staleTokenDocIds.length} invalid/unregistered parent tokens.`);
          const batch = db.batch();
          staleTokenDocIds.forEach((docId) => {
            batch.delete(db.collection('parent_devices').doc(docId));
          });
          await batch.commit();
        }
      }

      // 8. Update original boarding record with delivery trace
      await snap.ref.update({
        notification_sent: true,
        notification_sent_at: admin.firestore.FieldValue.serverTimestamp(),
        notification_recipients_count: response.successCount,
        notification_summary: notificationBody,
        fcm_status: response.successCount > 0 ? 'DELIVERED' : 'FAILED_NO_VALID_TOKENS'
      });

      return {
        success: true,
        sentCount: response.successCount,
        failedCount: response.failureCount
      };
    } catch (sendError) {
      logger.error('Critical failure in FCM dispatch:', sendError);
      
      // Rollback idempotency lock on network exception so retry is permitted
      await idempotencyRef.delete().catch(() => {});
      
      await snap.ref.update({
        fcm_status: 'DISPATCH_ERROR',
        fcm_error: sendError.message
      });

      throw sendError;
    }
  }
);

/**
 * HTTPS ENDPOINT FOR ESP32 OVER WI-FI:
 * Accepts RFID tap from ESP32, validates the student, writes the boarding record,
 * which immediately fires the FCM push notification above.
 *
 * ESP32 Wi-Fi HTTP POST:
 * URL: https://us-central1-transitiq-c2d78.cloudfunctions.net/apiRfidTap
 * Headers: Content-Type: application/json
 * Body: {"device_id": "ESP32-BUS-001", "bus_id": "54", "card_uid": "E2000019"}
 */
exports.apiRfidTap = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    const { device_id, bus_id, card_uid } = req.body;

    if (!card_uid) {
      return res.status(400).json({ error: 'Missing required card_uid in request body' });
    }

    const cleanUid = String(card_uid).trim().toUpperCase();
    const assignedBus = bus_id || '54';
    const assignedDevice = device_id || 'ESP32-BUS-001';

    logger.info(`Received ESP32 RFID Tap: Card UID: ${cleanUid}, Bus: ${assignedBus}, Device: ${assignedDevice}`);

    try {
      // 1. Check Student Database in Firestore
      // Look up student by rfid_card_uid
      let student = null;
      const studentSnap = await db
        .collection('students')
        .where('rfid_card_uid', '==', cleanUid)
        .limit(1)
        .get();

      if (!studentSnap.empty) {
        student = studentSnap.docs[0].data();
      } else {
        // Fallback to check known hardware demo cards if Firestore is not yet fully seeded
        if (cleanUid === 'E2000019') {
          student = {
            student_id: '732224AI020',
            full_name: 'DHANYA SHRI.A.C',
            assigned_bus: '54',
            account_status: 'Active',
            bus_pass_status: 'Active'
          };
        } else if (cleanUid === 'A489C132') {
          student = {
            student_id: '732224AI054',
            full_name: 'KAVIYAN.V',
            assigned_bus: '67',
            account_status: 'Active',
            bus_pass_status: 'Active'
          };
        }
      }

      if (!student) {
        return res.status(200).json({
          success: false,
          status: 'UNREGISTERED_CARD',
          message: `Card UID ${cleanUid} is not registered in TransitIQ`
        });
      }

      // 2. Bus assignment verification
      if (student.assigned_bus && student.assigned_bus !== assignedBus) {
        return res.status(200).json({
          success: false,
          status: 'WRONG_BUS',
          message: `Wrong Bus! Student is assigned to Bus ${student.assigned_bus}`
        });
      }

      // 3. Create Valid Boarding Record in Firestore
      // This write will automatically trigger onBoardingRecordCreated and send the FCM Push Notification!
      const eventId = `EVT-ESP32-${Date.now().toString(36).toUpperCase()}`;
      const recordDoc = {
        event_id: eventId,
        device_id: assignedDevice,
        bus_id: assignedBus,
        card_uid: cleanUid,
        student_id: student.student_id,
        student_name: student.full_name,
        verification_status: 'VALID',
        rejection_reason: null,
        event_timestamp: new Date().toISOString(),
        received_timestamp: new Date().toISOString(),
        created_via: 'ESP32_WIFI_DIRECT',
        notification_sent: false
      };

      const docRef = await db.collection('boarding_records').add(recordDoc);

      logger.info(`Boarding record created: ${docRef.id} for ${student.full_name}. Triggering push notification.`);

      return res.status(200).json({
        success: true,
        status: 'VALID',
        event_id: eventId,
        student_id: student.student_id,
        student_name: student.full_name,
        bus_id: assignedBus,
        message: `Boarding verified for ${student.full_name}. Parent push notification queued.`
      });
    } catch (err) {
      logger.error('Error handling ESP32 RFID tap:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
);

/**
 * HTTPS ENDPOINT FOR TESTING PUSH NOTIFICATIONS:
 * Allows dashboard or admin to trigger a test notification directly to a parent device
 */
exports.sendManualTestNotification = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    const studentId = req.query.student_id || req.body?.student_id || '732224AI020';
    const studentName = req.query.student_name || req.body?.student_name || 'DHANYA SHRI.A.C';
    const busId = req.query.bus_id || req.body?.bus_id || 'BUS01';

    try {
      const parentDevicesSnap = await db
        .collection('parent_devices')
        .where('student_id', '==', studentId)
        .get();

      if (parentDevicesSnap.empty) {
        return res.status(404).json({
          success: false,
          message: `No registered parent device found for ${studentName} (${studentId}). Please register device first.`
        });
      }

      const tokens = [];
      parentDevicesSnap.forEach((d) => {
        const t = d.data().fcm_token;
        if (t) tokens.push(t);
      });

      const timeStr = formatNotificationTime(new Date());
      const title = 'TransitIQ – Bus Boarding Alert';
      const body = `Your child ${studentName} has boarded Bus ${busId} at ${timeStr}.`;

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: {
          student_id: studentId,
          student_name: studentName,
          bus_number: busId,
          boarding_status: 'VALID',
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: `Dispatched test alert to ${response.successCount} parent device(s).`,
        notification: { title, body },
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (err) {
      logger.error('Error in sendManualTestNotification:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);
