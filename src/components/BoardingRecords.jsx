import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Layers,
  Cpu
} from 'lucide-react';
import { VERIFICATION_STATUSES } from '../types/models';

export default function BoardingRecords({ data }) {
  const records = data.boarding_records || [];
  const buses = data.buses || [];
  const devices = data.devices || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busFilter, setBusFilter] = useState('ALL');
  const [syncFilter, setSyncFilter] = useState('ALL');

  const filteredRecords = records.filter((r) => {
    const matchesSearch = 
      r.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.student_id && r.student_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.card_uid.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.verification_status === statusFilter;
    const matchesBus = busFilter === 'ALL' || r.bus_id === busFilter;
    const matchesSync = syncFilter === 'ALL' || r.synchronization_status === syncFilter;

    return matchesSearch && matchesStatus && matchesBus && matchesSync;
  });

  const exportCSV = () => {
    const headers = ['Event ID', 'Student Name', 'Student ID', 'Bus ID', 'Card UID', 'Verification Status', 'Rejection Reason', 'Event Timestamp', 'Received Timestamp', 'Device ID', 'Sync Status'];
    const rows = filteredRecords.map((r) => [
      r.event_id,
      `"${r.student_name}"`,
      r.student_id || 'N/A',
      r.bus_id,
      r.card_uid,
      r.verification_status,
      `"${r.rejection_reason || 'Verified'}"`,
      r.event_timestamp,
      r.received_timestamp,
      r.device_id,
      r.synchronization_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpassflow_boarding_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBadge = (status) => {
    switch (status) {
      case VERIFICATION_STATUSES.VALID:
        return <span className="badge badge-valid"><ShieldCheck size={11} /> Valid</span>;
      case VERIFICATION_STATUSES.WRONG_BUS:
        return <span className="badge badge-wrong-bus">Wrong Bus</span>;
      case VERIFICATION_STATUSES.PASS_EXPIRED:
        return <span className="badge badge-expired">Expired</span>;
      case VERIFICATION_STATUSES.UNPAID:
        return <span className="badge badge-unpaid">Unpaid</span>;
      case VERIFICATION_STATUSES.DUPLICATE:
        return <span className="badge badge-duplicate">Duplicate</span>;
      case VERIFICATION_STATUSES.BLOCKED_CARD:
        return <span className="badge badge-blocked">Blocked Card</span>;
      default:
        return <span className="badge badge-danger">Unregistered</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            RFID Boarding & Tap Audit Trail
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Immutable trace of every physical RFID card interaction, verification outcome, and device timestamp.
          </p>
        </div>

        <button onClick={exportCSV} className="btn btn-teal btn-sm">
          <Download size={15} /> Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by student, ID, Event ID, Card UID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Outcomes</option>
            <option value="VALID">Valid</option>
            <option value="WRONG_BUS">Wrong Bus</option>
            <option value="PASS_EXPIRED">Expired Pass</option>
            <option value="UNPAID">Unpaid</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="UNREGISTERED_CARD">Unregistered Card</option>
          </select>

          <select value={busFilter} onChange={(e) => setBusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Buses</option>
            {buses.map((b) => (
              <option key={b.bus_id} value={b.bus_id}>{b.bus_number}</option>
            ))}
          </select>

          <select value={syncFilter} onChange={(e) => setSyncFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Sync States</option>
            <option value="Synchronized">Synchronized</option>
            <option value="Delayed Sync">Delayed Sync</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredRecords.length}</strong> of {records.length} events
          </div>
        </div>
      </div>

      {/* Boarding Records Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Student</th>
                <th>Student ID</th>
                <th>Bus</th>
                <th>Card UID</th>
                <th>Event Time</th>
                <th>Verification Status</th>
                <th>Rejection Reason</th>
                <th>Device ID</th>
                <th>Sync Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No boarding records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.event_id}>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--accent-teal)' }}>{r.event_id}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                    <td>
                      <code style={{ fontSize: '11.5px' }}>{r.student_id || 'N/A'}</code>
                    </td>
                    <td>{r.bus_id}</td>
                    <td>
                      <code style={{ fontSize: '11.5px' }}>{r.card_uid}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        {new Date(r.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {new Date(r.event_timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{renderBadge(r.verification_status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {r.rejection_reason || 'Verified successfully'}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.device_id}</span>
                    </td>
                    <td>
                      <span className={`badge ${r.synchronization_status === 'Synchronized' ? 'badge-valid' : 'badge-warning'}`}>
                        {r.synchronization_status}
                      </span>
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
