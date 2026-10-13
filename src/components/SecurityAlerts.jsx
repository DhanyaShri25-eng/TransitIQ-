import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Bus, 
  Cpu, 
  Filter, 
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { db } from '../services/db';

export default function SecurityAlerts({ data, onRefresh, role }) {
  const alerts = data.security_alerts || [];
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.resolution_status === statusFilter;
    return matchesSev && matchesStatus;
  });

  const handleResolve = (alertId) => {
    db.resolveAlert(alertId);
    onRefresh();
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            Transport Security & Wrong Bus Alerts
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time notifications for unauthorized bus boardings, expired passes, unrecognized RFID cards, and offline hardware.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-danger">
            Unresolved: {alerts.filter(a => a.resolution_status !== 'Resolved').length}
          </span>
          <span className="badge badge-valid">
            Resolved: {alerts.filter(a => a.resolution_status === 'Resolved').length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="table-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div className="filter-bar">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Severities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
            Total Incidents: <strong>{filteredAlerts.length}</strong>
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--accent-teal)', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', color: '#FFF' }}>All Clear! No alerts under current filters.</h4>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.resolution_status === 'Resolved';
            const isHigh = alert.severity === 'High';

            return (
              <div 
                key={alert.alert_id}
                style={{
                  background: 'var(--bg-card)',
                  border: isResolved ? '1px solid var(--border-subtle)' : isHigh ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isResolved ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isHigh ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isHigh ? '#EF4444' : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AlertTriangle size={18} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{alert.alert_type}</span>
                  </div>

                  <span className={`badge ${isHigh ? 'badge-danger' : 'badge-warning'}`}>
                    {alert.severity}
                  </span>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {alert.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Student</span>
                    <strong>{alert.student_name || 'Unidentified'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Bus / Device</span>
                    <strong>{alert.bus_id} ({alert.device_id})</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Timestamp</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Status</span>
                    <span className={`badge ${isResolved ? 'badge-valid' : 'badge-warning'}`}>
                      {alert.resolution_status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.alert_id}</code>
                  {canEdit && !isResolved && (
                    <button 
                      onClick={() => handleResolve(alert.alert_id)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '12px', color: 'var(--accent-teal)', borderColor: 'rgba(0, 208, 156, 0.3)' }}
                    >
                      <CheckCircle size={13} /> Mark Resolved
                    </button>
                  )}
                  {isResolved && (
                    <span style={{ fontSize: '11.5px', color: 'var(--status-valid)' }}>
                      ✓ Resolved at {new Date(alert.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
