/**
 * SmartPassFlow RFID Verification Engine & Audio Feedback
 * Implements authoritative 7-point verification, duplicate window check,
 * bus boarding count tracking, alert generation, and hardware audio synthesizer.
 */

import { db } from './db';
import { VERIFICATION_STATUSES } from '../types/models';

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playBeep(type) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      if (type === 'VALID') {
        // High double chime
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now + 0.14);
        gain2.gain.setValueAtTime(0.2, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.3);
      } else if (type === 'WRONG_BUS') {
        // Double warning buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(260, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Deep error buzz for invalid / expired / unpaid
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable:', e);
    }
  }
}

export const soundFx = new AudioSynthesizer();

/**
 * Authoritative Backend Verification Function
 * Evaluates raw tap event and returns complete response object
 */
export function verifyRfidEvent({
  event_id,
  device_id,
  bus_id,
  card_uid,
  timestamp,
  auth_token,
  is_offline_sync = false
}) {
  const currentData = db.getSnapshot();
  const settings = currentData.settings || {};
  const duplicateWindowMs = (settings.duplicate_tap_window_minutes || 5) * 60 * 1000;
  const eventTime = timestamp ? new Date(timestamp) : new Date();
  const eventTimeIso = eventTime.toISOString();

  // 1. Authenticate Device
  const device = currentData.devices.find((d) => d.device_id === device_id);
  if (!device) {
    db.addAlert({
      alert_type: 'Unregistered Device Attempt',
      severity: 'High',
      student_id: null,
      student_name: null,
      bus_id: bus_id || 'UNKNOWN',
      device_id: device_id || 'UNKNOWN',
      description: `Unrecognized device ID "${device_id}" attempted event ingestion.`
    });
    return {
      success: false,
      verification_status: 'REJECTED',
      reason: 'UNREGISTERED_DEVICE',
      message: `Device ${device_id} is not registered in the transport network`
    };
  }

  // Verify device is assigned to this bus
  if (device.assigned_bus && bus_id && device.assigned_bus !== bus_id) {
    db.addAlert({
      alert_type: 'Device Bus Mismatch',
      severity: 'Medium',
      student_id: null,
      student_name: null,
      bus_id: bus_id,
      device_id: device_id,
      description: `Device ${device_id} assigned to ${device.assigned_bus} but reported for ${bus_id}.`
    });
    return {
      success: false,
      verification_status: 'REJECTED',
      reason: 'DEVICE_BUS_MISMATCH',
      message: `Device ${device_id} is assigned to ${device.assigned_bus}, not ${bus_id}`
    };
  }

  // Update device heartbeat and status
  db.recordHeartbeat(device_id);

  // 2. Check Event ID Idempotency (prevent duplicate processing of retransmitted packets)
  const existingEvent = currentData.boarding_records.find((r) => r.event_id === event_id);
  if (existingEvent) {
    return {
      success: true,
      event_id,
      verification_status: existingEvent.verification_status,
      message: 'Event was previously processed (idempotent replay)',
      is_duplicate: true
    };
  }

  // 3. Find RFID Card
  const card = currentData.rfid_cards.find((c) => c.card_uid.toLowerCase() === card_uid.toLowerCase());
  if (!card) {
    const alertDesc = `Unregistered RFID card UID "${card_uid}" tapped at bus ${bus_id}.`;
    db.addAlert({
      alert_type: 'Unregistered RFID Card Scanned',
      severity: 'High',
      student_id: null,
      student_name: 'Unknown Individual',
      bus_id,
      device_id,
      description: alertDesc
    });

    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: 'UNKNOWN',
      card_uid,
      student_id: null,
      student_name: 'Unregistered Card',
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.UNREGISTERED_CARD,
      rejection_reason: `Card UID ${card_uid} is not registered in the system`,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.UNREGISTERED_CARD,
      reason: 'CARD_NOT_FOUND',
      message: 'Card UID is not registered. Please visit transport office.'
    };
  }

  // Update card's last tap timestamp
  card.last_tap_at = eventTimeIso;

  if (card.card_status === 'Blocked' || card.card_status === 'Lost') {
    db.addAlert({
      alert_type: 'Blocked Card Attempt',
      severity: 'High',
      student_id: card.student_id,
      student_name: 'Card Status: ' + card.card_status,
      bus_id,
      device_id,
      description: `Card ${card_uid} marked as ${card.card_status} tapped at ${bus_id}.`
    });

    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: 'UNKNOWN',
      card_uid,
      student_id: card.student_id || null,
      student_name: 'Blocked / Lost Card',
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.BLOCKED_CARD,
      rejection_reason: `Card status is ${card.card_status}`,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.BLOCKED_CARD,
      reason: 'CARD_BLOCKED',
      message: `Card is ${card.card_status}. Contact transport administrator.`
    };
  }

  // 4. Find Associated Student
  const student = currentData.students.find((s) => s.student_id === card.student_id || s.rfid_card_uid === card_uid);
  if (!student) {
    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: 'UNKNOWN',
      card_uid,
      student_id: null,
      student_name: 'Unassigned Card',
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.UNREGISTERED_CARD,
      rejection_reason: 'Card has not been assigned to a student record',
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.UNREGISTERED_CARD,
      reason: 'STUDENT_UNASSIGNED',
      message: 'Card is unlinked to any student profile'
    };
  }

  // 5. Check Student Account Status
  if (student.account_status !== 'Active') {
    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: student.assigned_route || 'UNKNOWN',
      card_uid,
      student_id: student.student_id,
      student_name: student.full_name,
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.INACTIVE_STUDENT,
      rejection_reason: `Student account status is ${student.account_status}`,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.INACTIVE_STUDENT,
      reason: 'STUDENT_INACTIVE',
      message: `Student account is ${student.account_status}. Access restricted.`
    };
  }

  // 6. Check Duplicate Tap in Configured Window (e.g. repeated tap on same bus)
  const recentTap = currentData.boarding_records.find((r) => {
    if (r.card_uid === card_uid && r.bus_id === bus_id && r.verification_status === VERIFICATION_STATUSES.VALID) {
      const diff = Math.abs(eventTime.getTime() - new Date(r.event_timestamp).getTime());
      return diff <= duplicateWindowMs;
    }
    return false;
  });

  if (recentTap) {
    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: student.assigned_route,
      card_uid,
      student_id: student.student_id,
      student_name: student.full_name,
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.DUPLICATE,
      rejection_reason: `Duplicate tap detected within ${settings.duplicate_tap_window_minutes || 5} min window. Count not incremented.`,
      is_duplicate: true,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('DUPLICATE');

    return {
      success: true,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.DUPLICATE,
      is_duplicate: true,
      student_name: student.full_name,
      message: 'Already tapped recently. Safe to board.'
    };
  }

  // 7. Check Bus Assignment
  if (student.assigned_bus && student.assigned_bus !== bus_id) {
    const alertDesc = `${student.full_name} (${student.student_id}) assigned to ${student.assigned_bus}, tapped reader on ${bus_id}.`;
    db.addAlert({
      alert_type: 'Wrong Bus Attempt',
      severity: 'Medium',
      student_id: student.student_id,
      student_name: student.full_name,
      bus_id,
      device_id,
      description: alertDesc
    });

    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: student.assigned_route,
      card_uid,
      student_id: student.student_id,
      student_name: student.full_name,
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.WRONG_BUS,
      rejection_reason: `Assigned to ${student.assigned_bus}. Cannot board ${bus_id}.`,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('WRONG_BUS');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.WRONG_BUS,
      reason: 'WRONG_BUS',
      assigned_bus: student.assigned_bus,
      student_name: student.full_name,
      message: `Wrong Bus! You are assigned to ${student.assigned_bus}.`
    };
  }

  // 8. Find Bus Pass & Check Expiry
  const pass = currentData.bus_passes.find((p) => p.student_id === student.student_id);
  const todayStr = eventTimeIso.split('T')[0];

  if (!pass || pass.pass_status !== 'Active' || (pass.expiry_date && pass.expiry_date < todayStr)) {
    const reasonText = !pass
      ? 'No active pass found'
      : pass.pass_status !== 'Active'
      ? `Pass is marked as ${pass.pass_status}`
      : `Pass expired on ${pass.expiry_date}`;

    db.addAlert({
      alert_type: 'Expired / Invalid Pass Presented',
      severity: 'High',
      student_id: student.student_id,
      student_name: student.full_name,
      bus_id,
      device_id,
      description: `${student.full_name}: ${reasonText}`
    });

    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: student.assigned_route,
      card_uid,
      student_id: student.student_id,
      student_name: student.full_name,
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.PASS_EXPIRED,
      rejection_reason: reasonText,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.PASS_EXPIRED,
      reason: 'PASS_EXPIRED',
      student_name: student.full_name,
      message: `Pass expired or suspended. (${reasonText})`
    };
  }

  // 9. Check Fee Payment Policy
  if (!settings.allow_unpaid_boarding && student.fee_payment_status !== 'Paid') {
    db.addAlert({
      alert_type: 'Unpaid Bus Pass Presented',
      severity: 'Medium',
      student_id: student.student_id,
      student_name: student.full_name,
      bus_id,
      device_id,
      description: `${student.full_name} has unpaid balance of ₹${pass.outstanding_balance || 0}.`
    });

    const record = {
      event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id,
      bus_id,
      route_id: student.assigned_route,
      card_uid,
      student_id: student.student_id,
      student_name: student.full_name,
      event_timestamp: eventTimeIso,
      received_timestamp: new Date().toISOString(),
      verification_status: VERIFICATION_STATUSES.UNPAID,
      rejection_reason: `Transport fees pending: ₹${pass.outstanding_balance || 0} outstanding`,
      is_duplicate: false,
      synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
      processed_at: new Date().toISOString()
    };
    currentData.boarding_records.unshift(record);
    db.saveData();
    soundFx.playBeep('REJECTED');

    return {
      success: false,
      event_id: record.event_id,
      verification_status: VERIFICATION_STATUSES.UNPAID,
      reason: 'FEES_PENDING',
      student_name: student.full_name,
      message: `Transport fees pending: ₹${pass.outstanding_balance || 0}. Please clear dues.`
    };
  }

  // --- 10. VALID VERIFICATION ---
  // Increment Bus Boarding Count
  const bus = currentData.buses.find((b) => b.bus_id === bus_id);
  let newBoardingCount = 1;
  if (bus) {
    bus.current_boarding_count = (bus.current_boarding_count || 0) + 1;
    bus.last_device_communication = new Date().toISOString();
    newBoardingCount = bus.current_boarding_count;

    // Check capacity warning
    const capacity = bus.capacity || 40;
    const pct = Math.round((newBoardingCount / capacity) * 100);
    if (pct >= (settings.capacity_warning_threshold_pct || 85)) {
      db.addAlert({
        alert_type: 'Bus Capacity Threshold Reached',
        severity: pct >= 100 ? 'High' : 'Medium',
        student_id: null,
        student_name: null,
        bus_id,
        device_id,
        description: `Bus ${bus.bus_number} occupancy at ${pct}% (${newBoardingCount}/${capacity} seats).`
      });
    }
  }

  // Generate Parent SMS Notification
  const parentMobile = student.parent_mobile || student.parent_phone || student.emergency_contact || 'N/A';
  const parentName = student.parent_name || 'Parent';
  const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const smsMessage = `Dear ${parentName}, your ward ${student.full_name} (${student.student_id}) has safely boarded Bus ${bus_id} at ${student.boarding_stop || 'Assigned Stop'} at ${timeFormatted}. - TransitIQ`;

  const record = {
    event_id: event_id || `EVT-${Date.now().toString(36).toUpperCase()}`,
    device_id,
    bus_id,
    route_id: student.assigned_route,
    card_uid,
    student_id: student.student_id,
    student_name: student.full_name,
    event_timestamp: eventTimeIso,
    received_timestamp: new Date().toISOString(),
    verification_status: VERIFICATION_STATUSES.VALID,
    rejection_reason: null,
    is_duplicate: false,
    synchronization_status: is_offline_sync ? 'Delayed Sync' : 'Synchronized',
    processed_at: new Date().toISOString(),
    parent_sms: {
      sent: true,
      recipient_mobile: parentMobile,
      recipient_name: parentName,
      message_text: smsMessage,
      gateway: 'Fast2SMS / Twilio Cloud Gateway',
      dispatched_at: new Date().toISOString(),
      delivery_status: 'Delivered'
    }
  };

  currentData.boarding_records.unshift(record);
  db.saveData();
  soundFx.playBeep('VALID');

  return {
    success: true,
    event_id: record.event_id,
    verification_status: VERIFICATION_STATUSES.VALID,
    student_name: student.full_name,
    student_id: student.student_id,
    bus_id,
    boarding_count: newBoardingCount,
    parent_sms: record.parent_sms,
    message: `Verified: ${student.full_name}. SMS dispatched to Parent (${parentMobile})!`
  };
}

/**
 * Batch synchronization endpoint simulation for MicroSD offline queues
 */
export function syncOfflineBatch(deviceId, busId, eventsBatch) {
  const results = [];
  let addedCount = 0;
  let duplicateCount = 0;

  for (const evt of eventsBatch) {
    const res = verifyRfidEvent({
      event_id: evt.event_id,
      device_id: deviceId,
      bus_id: busId,
      card_uid: evt.card_uid,
      timestamp: evt.timestamp,
      is_offline_sync: true
    });
    results.push({
      event_id: evt.event_id,
      status: res.verification_status,
      acknowledged: true
    });
    if (res.is_duplicate) {
      duplicateCount++;
    } else {
      addedCount++;
    }
  }

  // Update device sync timestamp and clear pending count
  const dev = db.getSnapshot().devices.find((d) => d.device_id === deviceId);
  if (dev) {
    dev.last_successful_sync = new Date().toISOString();
    dev.pending_event_count = 0;
    db.saveData();
  }

  return {
    success: true,
    deviceId,
    totalReceived: eventsBatch.length,
    processedCount: addedCount,
    duplicatesIgnored: duplicateCount,
    acknowledgments: results
  };
}
