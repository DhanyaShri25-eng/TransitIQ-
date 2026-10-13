import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Bus, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { VERIFICATION_STATUSES } from '../types/models';

export default function ReportsAnalytics({ data }) {
  const students = data.students || [];
  const buses = data.buses || [];
  const passes = data.bus_passes || [];
  const records = data.boarding_records || [];
  const payments = data.payments || [];
  const alerts = data.security_alerts || [];

  const [dateRange, setDateRange] = useState('ALL');

  // Metrics
  const totalScans = records.length;
  const validBoardings = records.filter(r => r.verification_status === VERIFICATION_STATUSES.VALID).length;
  const unauthorizedAttempts = records.filter(r => r.verification_status !== VERIFICATION_STATUSES.VALID).length;
  const totalFees = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstandingFees = passes.reduce((sum, p) => sum + Number(p.outstanding_balance || 0), 0);

  const exportReportCSV = (reportType) => {
    let headers = [];
    let rows = [];

    if (reportType === 'boardings_by_bus') {
      headers = ['Bus ID', 'Bus Number', 'Seating Capacity', 'Current Boarding Count', 'Utilization %'];
      rows = buses.map(b => [
        b.bus_id,
        b.bus_number,
        b.capacity,
        b.current_boarding_count,
        Math.round((b.current_boarding_count / b.capacity) * 100) + '%'
      ]);
    } else if (reportType === 'fees_audit') {
      headers = ['Student ID', 'Student Name', 'Total Fee', 'Amount Paid', 'Outstanding Balance', 'Payment Status'];
      rows = passes.map(p => {
        const s = students.find(st => st.student_id === p.student_id);
        return [
          p.student_id,
          `"${s?.full_name || 'N/A'}"`,
          p.total_fee,
          p.amount_paid,
          p.outstanding_balance,
          p.payment_status
        ];
      });
    } else {
      headers = ['Alert ID', 'Alert Type', 'Severity', 'Bus ID', 'Description', 'Created At', 'Status'];
      rows = alerts.map(a => [
        a.alert_id,
        a.alert_type,
        a.severity,
        a.bus_id,
        `"${a.description}"`,
        a.created_at,
        a.resolution_status
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpassflow_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            Transport Intelligence & Regulatory Reports
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Comprehensive analytics differentiating total RFID taps, accepted boarding events, and fleet utilization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => exportReportCSV('boardings_by_bus')} className="btn btn-outline btn-sm">
            <FileSpreadsheet size={14} /> Fleet Utilization CSV
          </button>
          <button onClick={() => exportReportCSV('fees_audit')} className="btn btn-teal btn-sm">
            <Download size={14} /> Fee Ledger Audit CSV
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Total RFID Taps Processed</div>
          <div className="stat-value">{totalScans}</div>
          <div className="stat-sub">Physical card interactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Accepted Boarding Count</div>
          <div className="stat-value" style={{ color: 'var(--status-valid)' }}>{validBoardings}</div>
          <div className="stat-sub">Strict pass & fee cleared</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unauthorized Boarding Attempts</div>
          <div className="stat-value" style={{ color: '#EF4444' }}>{unauthorizedAttempts}</div>
          <div className="stat-sub">Wrong bus, expired, unpaid</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Fee Collection</div>
          <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>₹{totalFees.toLocaleString()}</div>
          <div className="stat-sub">₹{outstandingFees.toLocaleString()} pending dues</div>
        </div>
      </div>

      {/* Utilization Charts & Route Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Fleet Bus Utilization */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '22px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
            Bus Seating Capacity & Boarding Totals
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {buses.map((bus) => {
              const cap = bus.capacity || 45;
              const count = bus.current_boarding_count || 0;
              const pct = Math.round((count / cap) * 100);

              return (
                <div key={bus.bus_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{bus.bus_number} ({bus.registration_number})</span>
                    <span style={{ color: pct >= 85 ? '#EF4444' : 'var(--accent-teal)', fontWeight: 700 }}>
                      {count} / {cap} seats ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(pct, 100)}%`, 
                        background: pct >= 85 ? '#EF4444' : 'var(--accent-teal)' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '22px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
            Corridor Passenger Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(data.routes || []).map((route) => {
              const assignedCount = students.filter(s => s.assigned_route === route.route_id).length;
              const pct = students.length > 0 ? Math.round((assignedCount / students.length) * 100) : 0;

              return (
                <div key={route.route_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{route.route_name}</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{assignedCount} Students ({pct}%)</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: '#38BDF8' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
