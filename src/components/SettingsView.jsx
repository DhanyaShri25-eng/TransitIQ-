import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Database
} from 'lucide-react';
import { db } from '../services/db';
import { firebaseChat } from '../services/firebaseService';

export default function SettingsView({ data, onRefresh, role }) {
  const currentSettings = data.settings || {};

  const [form, setForm] = useState({
    duplicate_tap_window_minutes: currentSettings.duplicate_tap_window_minutes || 5,
    allow_unpaid_boarding: !!currentSettings.allow_unpaid_boarding,
    capacity_warning_threshold_pct: currentSettings.capacity_warning_threshold_pct || 85,
    device_heartbeat_timeout_seconds: currentSettings.device_heartbeat_timeout_seconds || 120,
    academic_year: currentSettings.academic_year || '2026-2027',
    college_name: currentSettings.college_name || 'Innovation Institute of Technology & Engineering'
  });

  const [firebaseConfig, setFirebaseConfig] = useState(
    currentSettings.firebase_config || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      connected: false
    }
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fbStatusMessage, setFbStatusMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    db.updateSettings({
      ...form,
      firebase_config: firebaseConfig
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefresh();
  };

  const handleTestFirebase = () => {
    const res = firebaseChat.initFirebase(firebaseConfig);
    setFbStatusMessage(res.message);
    setFirebaseConfig(prev => ({ ...prev, connected: res.connected }));
  };

  const handleResetData = () => {
    if (confirm('Warning: This will reset all students, buses, RFID events, and payments back to the initial 10-student demonstration seed. Proceed?')) {
      db.resetToDefault();
      onRefresh();
      alert('System database reset to initial demonstration state.');
    }
  };

  const canEdit = role === 'Super Admin';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            System Settings & Hardware Parameters
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure college boarding verification rules, duplicate scan suppression, and cloud backend connections.
          </p>
        </div>

        {saveSuccess && (
          <span style={{ fontSize: '13px', color: 'var(--status-valid)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Settings saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Policy & Hardware Rules */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-teal)' }} />
              RFID Verification Rules & Thresholds
            </h3>

            <div className="form-group">
              <label className="form-label">Anti-Passback Duplicate Tap Interval (Minutes)</label>
              <input 
                type="number" 
                min="1" 
                max="60"
                className="form-control" 
                value={form.duplicate_tap_window_minutes} 
                onChange={(e) => setForm({ ...form, duplicate_tap_window_minutes: Number(e.target.value) })} 
                disabled={!canEdit}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Repeated taps on the same bus within this window are logged as DUPLICATE and do not inflate boarding totals.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Bus Capacity Warning Threshold (%)</label>
              <input 
                type="number" 
                min="50" 
                max="100"
                className="form-control" 
                value={form.capacity_warning_threshold_pct} 
                onChange={(e) => setForm({ ...form, capacity_warning_threshold_pct: Number(e.target.value) })} 
                disabled={!canEdit}
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Transport Fee Boarding Policy</label>
              <select 
                className="form-control"
                value={form.allow_unpaid_boarding ? 'ALLOW' : 'STRICT'}
                onChange={(e) => setForm({ ...form, allow_unpaid_boarding: e.target.value === 'ALLOW' })}
                disabled={!canEdit}
              >
                <option value="STRICT">Strict: Block boarding if student fee status is Unpaid</option>
                <option value="ALLOW">Lenient: Allow boarding with warning flag for unpaid passes</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">IoT Device Heartbeat Offline Timeout (Seconds)</label>
              <input 
                type="number" 
                min="30" 
                max="600"
                className="form-control" 
                value={form.device_heartbeat_timeout_seconds} 
                onChange={(e) => setForm({ ...form, device_heartbeat_timeout_seconds: Number(e.target.value) })} 
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Firebase Real-Time Cloud Configuration */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} style={{ color: '#0EA5E9' }} />
              Firebase Cloud Backend & Live Chat
            </h3>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              The application runs with built-in instant local & multi-tab cloud emulation. Connect your production Firebase project to persist chat and RFID events directly to Google Firestore.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input 
                  type="text" 
                  placeholder="AIzaSy..." 
                  className="form-control"
                  value={firebaseConfig.apiKey}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project ID</label>
                <input 
                  type="text" 
                  placeholder="transitiq-prod" 
                  className="form-control"
                  value={firebaseConfig.projectId}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Auth Domain</label>
                <input 
                  type="text" 
                  placeholder="project.firebaseapp.com" 
                  className="form-control"
                  value={firebaseConfig.authDomain}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Storage Bucket</label>
                <input 
                  type="text" 
                  placeholder="project.appspot.com" 
                  className="form-control"
                  value={firebaseConfig.storageBucket}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleTestFirebase}
                className="btn btn-outline btn-sm"
                disabled={!canEdit}
              >
                Test Firebase Connection
              </button>
              {fbStatusMessage && (
                <span style={{ fontSize: '11.5px', color: firebaseConfig.connected ? 'var(--status-valid)' : '#EF4444' }}>
                  {fbStatusMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Reset Data */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            {canEdit && (
              <button 
                type="button" 
                onClick={handleResetData}
                className="btn btn-outline btn-sm"
                style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                <Database size={14} /> Reset Demonstration Database
              </button>
            )}
          </div>

          {canEdit && (
            <button type="submit" className="btn btn-teal">
              <Save size={15} /> Save Configuration
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
