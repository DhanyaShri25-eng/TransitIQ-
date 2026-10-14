import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Radio, 
  ExternalLink,
  Laptop,
  RefreshCw,
  Info
} from 'lucide-react';
import { fcmService } from '../services/fcmService';
import { db } from '../services/db';
import { firebaseChat } from '../services/firebaseService';

export default function ParentDeviceRegistration({ data, onRefresh }) {
  const students = data.students || [];
  const currentSettings = data.settings || {};
  const firebaseConfig = currentSettings.firebase_config || {};

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.student_id || '732224AI020');
  const [permissionState, setPermissionState] = useState(fcmService.getPermissionState());
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [copiedToken, setCopiedToken] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const [customVapidKey, setCustomVapidKey] = useState(firebaseConfig.vapidKey || '');

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId) || students[0];

  const loadDevices = async () => {
    try {
      const devices = await fcmService.getRegisteredParentDevices();
      setRegisteredDevices(devices);
      setPermissionState(fcmService.getPermissionState());
    } catch (e) {
      console.warn('Error loading devices:', e);
    }
  };

  useEffect(() => {
    loadDevices();

    // Listen for incoming foreground push notifications
    const unsub = fcmService.onForegroundMessage((payload) => {
      setLiveNotification({
        title: payload.notification?.title || payload.data?.title || 'TransitIQ – Bus Boarding Alert',
        body: payload.notification?.body || payload.data?.body || '',
        data: payload.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      loadDevices();
    });

    return () => unsub();
  }, [selectedStudentId]);

  const handleRegisterCurrentDevice = async () => {
    if (!selectedStudent) {
      setActionMessage({ text: 'Please select a student profile first.', type: 'error' });
      return;
    }

    setLoading(true);
    setActionMessage({ text: '', type: '' });

    try {
      // Ensure firebase app is initialized if config exists
      if (!firebaseChat.isFirebaseConnected && firebaseConfig.apiKey && firebaseConfig.projectId) {
        firebaseChat.initFirebase(firebaseConfig);
      }

      const res = await fcmService.registerParentDevice(selectedStudent, customVapidKey);
      setPermissionState(Notification.permission);
      setActionMessage({
        text: `Device successfully registered for parent of ${selectedStudent.full_name}! FCM token generated.`,
        type: 'success'
      });
      await loadDevices();
    } catch (err) {
      setActionMessage({ text: err.message, type: 'error' });
      setPermissionState(fcmService.getPermissionState());
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async (token) => {
    try {
      await fcmService.unregisterDevice(token);
      setActionMessage({ text: 'Device unregistered successfully.', type: 'info' });
      await loadDevices();
    } catch (e) {
      setActionMessage({ text: e.message, type: 'error' });
    }
  };

  const handleSendTestNotification = async () => {
    if (!selectedStudent) return;
    setLoading(true);

    try {
      const timeFormatted = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const busId = selectedStudent.assigned_bus || 'BUS01';
      const fcmTitle = 'TransitIQ – Bus Boarding Alert';
      const fcmBody = `Your child ${selectedStudent.full_name} has boarded Bus ${busId} at ${timeFormatted}.`;

      // Trigger test notification locally and to listeners
      fcmService.notifyListeners({
        notification: {
          title: fcmTitle,
          body: fcmBody
        },
        data: {
          event_id: `EVT-TEST-${Date.now().toString(36).toUpperCase()}`,
          student_id: selectedStudent.student_id,
          student_name: selectedStudent.full_name,
          bus_number: busId,
          boarding_status: 'VALID',
          timestamp: new Date().toISOString()
        }
      });

      // Browser native push if permission granted
      if (Notification.permission === 'granted') {
        new Notification(fcmTitle, {
          body: fcmBody,
          icon: '/favicon.svg',
          badge: '/favicon.svg'
        });
      }

      // Also record in database boarding records
      db.verifyAndRecordTap({
        event_id: `EVT-TEST-${Date.now().toString(36).toUpperCase()}`,
        device_id: 'ESP32-WROOM-32',
        bus_id: busId,
        card_uid: selectedStudent.rfid_card_uid,
        timestamp: new Date().toISOString()
      });

      onRefresh();

      setActionMessage({
        text: `Test boarding push notification dispatched for ${selectedStudent.full_name}!`,
        type: 'success'
      });
    } catch (err) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} style={{ color: 'var(--accent-teal)' }} />
            Parent Device Registration & FCM Push Notifications
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Register parent mobile and browser devices to receive instant Firebase Cloud Messaging (FCM) boarding push alerts.
          </p>
        </div>

        <button onClick={loadDevices} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh Devices
        </button>
      </div>

      {/* Live Push Notification Toast Banner */}
      {liveNotification && (
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 78, 59, 0.4))',
            border: '1px solid #10B981',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
              <Bell size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                {liveNotification.title}
              </div>
              <div style={{ fontSize: '13px', color: '#D1FAE5', marginTop: '2px' }}>
                {liveNotification.body}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(209, 250, 229, 0.7)', marginTop: '4px' }}>
                Received at: {liveNotification.timestamp} · Target Device: Active Screen
              </div>
            </div>
          </div>
          <button 
            onClick={() => setLiveNotification(null)}
            className="btn btn-outline btn-sm"
            style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', padding: '4px 10px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {actionMessage.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: actionMessage.type === 'success' ? '#10B981' : '#EF4444',
          border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Device Registration Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} style={{ color: 'var(--accent-teal)' }} />
            Register Parent Device
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Bind the parent's phone or computer browser to their child's profile to receive push notifications upon ESP32 RFID card validation.
          </p>

          {/* Student Selector */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Select Student Ward</label>
            <select 
              className="form-control"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name} ({s.student_id}) — Assigned Bus {s.assigned_bus}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parent / Guardian:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedStudent.parent_name || 'CHINNASAMY.A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Phone:</span>
                <span style={{ color: '#FFFFFF' }}>{selectedStudent.parent_mobile || selectedStudent.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>RFID Card UID:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 600 }}>{selectedStudent.rfid_card_uid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Bus Gate:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Bus {selectedStudent.assigned_bus}</span>
              </div>
            </div>
          )}

          {/* Optional Web Push VAPID Key */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Web Push VAPID Key (Optional)</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From Firebase Console &gt; Cloud Messaging</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. BElv... (or leave empty if using default)"
              className="form-control"
              value={customVapidKey}
              onChange={(e) => setCustomVapidKey(e.target.value)}
            />
          </div>

          {/* Permission Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Browser Permission:</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: permissionState === 'granted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: permissionState === 'granted' ? '#10B981' : '#EF4444'
            }}>
              {permissionState.toUpperCase()}
            </span>
          </div>

          <button
            onClick={handleRegisterCurrentDevice}
            disabled={loading}
            className="btn btn-teal"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontWeight: 600 }}
          >
            <Smartphone size={16} />
            {loading ? 'Requesting Permission & Generating Token...' : 'Register This Device for Parent Push Alerts'}
          </button>
        </div>

        {/* Live Notification Preview & Verification Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: '#0EA5E9' }} />
            Notification Payload Preview & Test
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            This exact notification payload is delivered to the registered parent's mobile or desktop screen the instant the ESP32 validates the RFID card.
          </p>

          {/* Sample Notification Visual Box */}
          <div style={{
            background: 'var(--bg-card-hover)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '11px', fontWeight: 700 }}>
                TIQ
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                TransitIQ – Bus Boarding Alert
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                Now
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Your child <strong style={{ color: 'var(--accent-teal)' }}>{selectedStudent?.full_name || 'DHANYA SHRI.A.C'}</strong> has boarded Bus <strong style={{ color: '#FFFFFF' }}>{selectedStudent?.assigned_bus || 'BUS01'}</strong> at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={handleSendTestNotification}
              disabled={loading}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Send size={15} /> Send Test Push Alert
            </button>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-teal)', fontWeight: 600, marginBottom: '6px' }}>
              <Info size={14} /> FCM Cloud Function Idempotency
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Duplicate scans within the anti-passback window are prevented from triggering repetitive parent notifications. The Cloud Function executes atomic locks in <code>fcm_sent_logs</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Registered Devices Table */}
      <div className="table-card">
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              Registered Parent Mobile & Web Devices ({registeredDevices.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              FCM tokens securely stored in Google Firestore collection <code>parent_devices</code>
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Ward</th>
                <th>Parent Name</th>
                <th>Device Platform</th>
                <th>FCM Registration Token</th>
                <th>Registered At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registeredDevices.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No parent devices registered yet. Click "Register This Device for Parent Push Alerts" above to link your phone or browser.
                  </td>
                </tr>
              ) : (
                registeredDevices.map((dev, idx) => (
                  <tr key={dev.id || dev.fcm_token || idx}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{dev.student_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {dev.student_id}</div>
                    </td>
                    <td>{dev.parent_name || 'Parent'}</td>
                    <td>
                      <span className="badge badge-valid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Laptop size={11} /> {dev.device_name || 'Active Browser'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--accent-teal)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dev.fcm_token}
                        </span>
                        <button
                          onClick={() => handleCopy(dev.fcm_token)}
                          title="Copy Token"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        >
                          {copiedToken ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {dev.registered_at ? new Date(dev.registered_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleUnregister(dev.fcm_token)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '4px 8px' }}
                        title="Unregister device"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
