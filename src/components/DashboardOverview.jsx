import React from 'react';
import { 
  Users, 
  Ticket, 
  Bus, 
  CreditCard, 
  AlertTriangle, 
  WifiOff, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Radio,
  Cpu
} from 'lucide-react';
import { VERIFICATION_STATUSES } from '../types/models';

export default function DashboardOverview({ 
  data, 
  onNavigateTab, 
  onOpenSimulator 
}) {
  const students = data.students || [];
  const buses = data.buses || [];
  const passes = data.bus_passes || [];
  const devices = data.devices || [];
  const records = data.boarding_records || [];
  const alerts = data.security_alerts || [];
  const payments = data.payments || [];

  // Computed metrics
  const totalStudents = students.length;
  const activePasses = passes.filter((p) => p.pass_status === 'Active').length;
  const totalBuses = buses.length;
  const todaysScans = records.length;
  const validBoardingsToday = records.filter((r) => r.verification_status === VERIFICATION_STATUSES.VALID).length;
  const wrongBusAlerts = alerts.filter((a) => a.alert_type?.toLowerCase().includes('wrong bus') && a.resolution_status !== 'Resolved').length;
  const offlineDevices = devices.filter((d) => d.device_status === 'Offline').length;
  const pendingSync = devices.reduce((sum, d) => sum + (d.pending_event_count || 0), 0);

  // Financial calculations
  const totalFeesCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstanding = passes.reduce((sum, p) => sum + Number(p.outstanding_balance || 0), 0);
  const paidStudentsCount = students.filter((s) => s.fee_payment_status === 'Paid').length;
  const unpaidStudentsCount = students.filter((s) => s.fee_payment_status !== 'Paid').length;

  // Validation outcome counts
  const outcomesCount = {
    VALID: records.filter((r) => r.verification_status === VERIFICATION_STATUSES.VALID).length,
    WRONG_BUS: records.filter((r) => r.verification_status === VERIFICATION_STATUSES.WRONG_BUS).length,
    PASS_EXPIRED: records.filter((r) => r.verification_status === VERIFICATION_STATUSES.PASS_EXPIRED).length,
    DUPLICATE: records.filter((r) => r.verification_status === VERIFICATION_STATUSES.DUPLICATE).length,
    UNREGISTERED_CARD: records.filter((r) => r.verification_status === VERIFICATION_STATUSES.UNREGISTERED_CARD).length,
  };

  // Status badge helper
  const renderVerificationBadge = (status) => {
    switch (status) {
      case VERIFICATION_STATUSES.VALID:
        return <span className="badge badge-valid"><ShieldCheck size={12} /> Valid</span>;
      case VERIFICATION_STATUSES.DUPLICATE:
        return <span className="badge badge-duplicate">Duplicate</span>;
      case VERIFICATION_STATUSES.WRONG_BUS:
        return <span className="badge badge-wrong-bus">Wrong Bus</span>;
      case VERIFICATION_STATUSES.PASS_EXPIRED:
        return <span className="badge badge-expired">Expired</span>;
      case VERIFICATION_STATUSES.UNPAID:
        return <span className="badge badge-unpaid">Unpaid</span>;
      case VERIFICATION_STATUSES.BLOCKED_CARD:
        return <span className="badge badge-blocked">Blocked Card</span>;
      default:
        return <span className="badge badge-danger">Unregistered</span>;
    }
  };

  return (
    <div className="dashboard-view">
      {/* 8 Primary Summary Cards matching Screenshot 4 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '16px'
      }}>
        {/* Students */}
        <div className="stat-card" onClick={() => onNavigateTab('students')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Students</div>
          <div className="stat-value">{totalStudents}</div>
        </div>

        {/* Active passes */}
        <div className="stat-card" onClick={() => onNavigateTab('bus-passes')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Active passes</div>
          <div className="stat-value">{activePasses}</div>
        </div>

        {/* Buses */}
        <div className="stat-card" onClick={() => onNavigateTab('buses')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Buses</div>
          <div className="stat-value">{totalBuses}</div>
        </div>

        {/* Today's scans */}
        <div className="stat-card" onClick={() => onNavigateTab('boarding-records')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Today's scans</div>
          <div className="stat-value">{todaysScans}</div>
        </div>

        {/* RFID-Verified Passengers */}
        <div className="stat-card" onClick={() => onNavigateTab('boarding-records')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">RFID-Verified Passengers</div>
          <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{validBoardingsToday}</div>
        </div>

        {/* Wrong-bus alerts */}
        <div className="stat-card" onClick={() => onNavigateTab('security-alerts')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Wrong-bus alerts</div>
          <div className="stat-value" style={{ color: wrongBusAlerts > 0 ? '#EF4444' : 'inherit' }}>{wrongBusAlerts}</div>
        </div>

        {/* Offline devices */}
        <div className="stat-card" onClick={() => onNavigateTab('devices')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Offline devices</div>
          <div className="stat-value" style={{ color: offlineDevices > 0 ? '#F59E0B' : 'inherit' }}>{offlineDevices}</div>
        </div>

        {/* Pending sync */}
        <div className="stat-card" onClick={() => onNavigateTab('offline-sync')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Pending sync</div>
          <div className="stat-value">{pendingSync}</div>
        </div>
      </div>

      {/* Compliance Disclaimer matching screenshot 4 */}
      <div style={{
        fontSize: '13px',
        color: '#94A3B8',
        marginBottom: '24px',
        fontWeight: 500
      }}>
        RFID verification totals are not exact occupancy and are never academic attendance.
      </div>

      {/* Analytics Visual Row matching Screenshot 4 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Left Chart: Last 7 days scans */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '22px 24px'
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '18px' }}>
            Last 7 days
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '20px' }}>
            {[
              { count: 1, height: '70%', isHigh: true },
              { count: 0, height: '0%', isHigh: false },
              { count: 0, height: '0%', isHigh: false },
              { count: 0, height: '0%', isHigh: false },
              { count: 0, height: '0%', isHigh: false },
              { count: 0, height: '0%', isHigh: false },
              { count: 0, height: '0%', isHigh: false }
            ].map((col, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#CBD5E1', fontWeight: 600 }}>
                  {col.count}
                </span>
                <div style={{
                  width: '34px',
                  height: col.height === '0%' ? '2px' : col.height,
                  background: col.isHigh ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px 4px 0 0'
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: Validation outcomes breakdown matching Screenshot 4 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
            Validation outcomes
          </h3>
          {records.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '14px', fontWeight: 500, minHeight: '120px' }}>
              No data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Valid Boarding', count: outcomesCount.VALID, color: '#10B981', total: records.length },
                { label: 'Wrong Bus Attempt', count: outcomesCount.WRONG_BUS, color: '#EF4444', total: records.length },
                { label: 'Expired Pass', count: outcomesCount.PASS_EXPIRED, color: '#F59E0B', total: records.length },
                { label: 'Duplicate Tap', count: outcomesCount.DUPLICATE, color: '#6366F1', total: records.length },
                { label: 'Unregistered Card', count: outcomesCount.UNREGISTERED_CARD, color: '#EC4899', total: records.length }
              ].map((item, idx) => {
                const pct = records.length > 0 ? Math.round((item.count / records.length) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{item.count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION A: Live Bus Boarding Overview Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <Radio size={18} style={{ color: 'var(--accent-teal)' }} />
            <span>Live Bus Boarding & Capacity Overview</span>
          </div>
          <button 
            onClick={() => onNavigateTab('buses')}
            className="btn btn-outline btn-sm"
          >
            Manage Buses
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Route</th>
                <th>Assigned Driver</th>
                <th>Boarding Count</th>
                <th>Capacity / Utilization</th>
                <th>Device Status</th>
                <th>Last RFID Tap</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => {
                const route = data.routes?.find((r) => r.route_id === bus.assigned_route);
                const driver = data.drivers?.find((d) => d.driver_id === bus.assigned_driver);
                const device = devices.find((d) => d.device_id === bus.device_id);
                const capacity = bus.capacity || 45;
                const count = bus.current_boarding_count || 0;
                const utilPct = Math.round((count / capacity) * 100);
                const isOverload = utilPct >= 85;

                return (
                  <tr key={bus.bus_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bus.bus_number}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{bus.registration_number}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{route?.route_name || bus.assigned_route}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{route?.starting_point} → {route?.destination}</div>
                    </td>
                    <td>{driver?.full_name || 'Unassigned'}</td>
                    <td>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                        {count}
                      </span>
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                        <span>{count} / {capacity} seats</span>
                        <span style={{ color: isOverload ? '#EF4444' : 'var(--text-secondary)', fontWeight: 600 }}>{utilPct}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min(utilPct, 100)}%`, 
                            background: isOverload ? '#EF4444' : 'var(--accent-teal)' 
                          }} 
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${device?.device_status === 'Online' ? 'badge-valid' : 'badge-offline'}`}>
                        {device?.device_status || 'Offline'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {bus.last_device_communication 
                          ? new Date(bus.last_device_communication).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'No taps yet'}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={onOpenSimulator}
                        className="btn btn-teal btn-sm"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      >
                        Tap Reader
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION B: Recent RFID Events Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <Clock size={18} style={{ color: '#0EA5E9' }} />
            <span>Recent RFID Reader Ingestion Events</span>
          </div>
          <button 
            onClick={() => onNavigateTab('boarding-records')}
            className="btn btn-outline btn-sm"
          >
            View All Scans
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Bus</th>
                <th>Card UID</th>
                <th>Timestamp</th>
                <th>Result</th>
                <th>Details / Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((rec) => (
                <tr key={rec.event_id}>
                  <td style={{ fontWeight: 600 }}>{rec.student_name}</td>
                  <td>
                    <code style={{ fontSize: '12px' }}>
                      {rec.student_id ? `${rec.student_id.slice(0, 4)}***${rec.student_id.slice(-3)}` : 'N/A'}
                    </code>
                  </td>
                  <td>{rec.bus_id}</td>
                  <td>
                    <code style={{ fontSize: '12px' }}>
                      {rec.card_uid.length > 5 ? `${rec.card_uid.slice(0, 3)}•••${rec.card_uid.slice(-2)}` : rec.card_uid}
                    </code>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(rec.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{renderVerificationBadge(rec.verification_status)}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    {rec.rejection_reason || 'Verified successfully'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION C & D: Fee Overview & IoT Device Status side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Section C: Fee Overview */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '22px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              Transport Fee Ledger
            </h3>
            <button onClick={() => onNavigateTab('fee-management')} className="btn btn-outline btn-sm">
              Ledger
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Fees Collected</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
                ₹{totalFeesCollected.toLocaleString()}
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding Dues</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#EF4444', marginTop: '4px' }}>
                ₹{totalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Eligible Paid Students: <strong>{paidStudentsCount}</strong></span>
            <span>Fee Pending: <strong>{unpaidStudentsCount}</strong></span>
          </div>
        </div>

        {/* Section D: IoT Device Status */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '22px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              ESP32 Device Fleet
            </h3>
            <button onClick={() => onNavigateTab('devices')} className="btn btn-outline btn-sm">
              Fleet
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {devices.map((dev) => (
              <div 
                key={dev.device_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{dev.device_name} ({dev.device_label})</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned: {dev.assigned_bus} · Wi-Fi RSSI: {dev.wifi_rssi} dBm</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${dev.device_status === 'Online' ? 'badge-valid' : 'badge-offline'}`}>
                    {dev.device_status}
                  </span>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Sync: {dev.pending_event_count > 0 ? `${dev.pending_event_count} queued` : 'Synchronized'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION E: Recent Security Alerts */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
            <span>Active Transport Security Alerts</span>
          </div>
          <button onClick={() => onNavigateTab('security-alerts')} className="btn btn-outline btn-sm">
            View All Alerts
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert Type</th>
                <th>Severity</th>
                <th>Student</th>
                <th>Bus / Device</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 4).map((al) => (
                <tr key={al.alert_id}>
                  <td style={{ fontWeight: 600 }}>{al.alert_type}</td>
                  <td>
                    <span className={`badge ${al.severity === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                      {al.severity}
                    </span>
                  </td>
                  <td>{al.student_name || 'N/A'}</td>
                  <td>{al.bus_id} ({al.device_id})</td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{al.description}</td>
                  <td>
                    <span className={`badge ${al.resolution_status === 'Resolved' ? 'badge-valid' : 'badge-warning'}`}>
                      {al.resolution_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
