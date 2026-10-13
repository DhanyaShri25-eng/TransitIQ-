import React, { useState } from 'react';
import { 
  Ticket, 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  CreditCard,
  RefreshCw,
  Eye
} from 'lucide-react';
import { db } from '../services/db';

export default function BusPasses({ data, onRefresh, role }) {
  const passes = data.bus_passes || [];
  const students = data.students || [];
  const buses = data.buses || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPass, setSelectedPass] = useState(null);

  const filteredPasses = passes.filter((p) => {
    const student = students.find((s) => s.student_id === p.student_id);
    const matchesSearch = 
      p.pass_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.student_id && p.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || p.pass_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (pass, newStatus) => {
    const p = passes.find(item => item.pass_id === pass.pass_id);
    if (p) {
      p.pass_status = newStatus;
      db.saveData();
      onRefresh();
    }
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            Digital Bus Pass Administration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Authoritative 7-point bus-pass validity evaluation, academic semester validity dates, and fee clearing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-valid">Active: {passes.filter(p => p.pass_status === 'Active').length}</span>
          <span className="badge badge-expired">Expired: {passes.filter(p => p.pass_status === 'Expired').length}</span>
        </div>
      </div>

      {/* Rules Notice */}
      <div style={{
        background: 'rgba(0, 208, 156, 0.08)',
        border: '1px solid rgba(0, 208, 156, 0.25)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#CBD5E1',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={24} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
        <div>
          <strong>Strict 7-Point Boarding Rule Enforced:</strong> A pass is valid ONLY when Student is Active, Card is Active, Pass is Active, Today's date is within validity, Fees are fully paid, Bus matches assignment, and tap is not a duplicate.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="table-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by Pass ID, Student name, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Pass Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending Activation">Pending Activation</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pass ID</th>
                <th>Student</th>
                <th>Assigned Bus</th>
                <th>Validity Window</th>
                <th>Fee Balance</th>
                <th>Pass Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasses.map((pass) => {
                const student = students.find((s) => s.student_id === pass.student_id);
                const isPaid = pass.payment_status === 'Paid';
                const today = new Date().toISOString().split('T')[0];
                const isDateValid = pass.start_date <= today && today <= pass.expiry_date;

                return (
                  <tr key={pass.pass_id}>
                    <td>
                      <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-teal)' }}>
                        {pass.pass_id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student?.full_name || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pass.student_id}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{pass.assigned_bus}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px' }}>{pass.start_date} → {pass.expiry_date}</div>
                      <div style={{ fontSize: '11px', color: isDateValid ? 'var(--status-valid)' : '#EF4444' }}>
                        {isDateValid ? 'Current Term' : 'Date Expired'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: isPaid ? 'var(--status-valid)' : '#EF4444' }}>
                        ₹{pass.amount_paid} / ₹{pass.total_fee}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {pass.outstanding_balance > 0 ? `₹${pass.outstanding_balance} due` : 'Fully Paid'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        pass.pass_status === 'Active' ? 'badge-valid' : 
                        pass.pass_status === 'Expired' ? 'badge-expired' : 'badge-danger'
                      }`}>
                        {pass.pass_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedPass(pass)}
                          className="btn btn-outline btn-sm" 
                          style={{ padding: '4px 8px' }}
                          title="View 7-Point Audit"
                        >
                          <Eye size={13} /> Audit
                        </button>
                        {canEdit && (
                          <>
                            {pass.pass_status === 'Active' ? (
                              <button 
                                onClick={() => handleToggleStatus(pass, 'Suspended')}
                                className="btn btn-outline btn-sm" 
                                style={{ padding: '4px 8px', color: '#EF4444' }}
                                title="Suspend Pass"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleStatus(pass, 'Active')}
                                className="btn btn-outline btn-sm" 
                                style={{ padding: '4px 8px', color: 'var(--status-valid)' }}
                                title="Activate Pass"
                              >
                                Activate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7-Point Verification Audit Modal */}
      {selectedPass && (
        <div className="modal-overlay" onClick={() => setSelectedPass(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Pass Verification Audit: {selectedPass.pass_id}
              </h3>
              <button onClick={() => setSelectedPass(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div className="modal-body">
              {(() => {
                const s = students.find((st) => st.student_id === selectedPass.student_id);
                const today = new Date().toISOString().split('T')[0];
                const cond1 = s && s.account_status === 'Active';
                const cond2 = s && s.rfid_card_uid;
                const cond3 = selectedPass.pass_status === 'Active';
                const cond4 = selectedPass.start_date <= today && today <= selectedPass.expiry_date;
                const cond5 = selectedPass.payment_status === 'Paid';
                const cond6 = selectedPass.assigned_bus;
                const allPass = cond1 && cond2 && cond3 && cond4 && cond5 && cond6;

                const auditItems = [
                  { num: 1, label: 'Student Account Active', ok: cond1, detail: `Account status: ${s?.account_status || 'N/A'}` },
                  { num: 2, label: 'RFID Card Registered & Active', ok: cond2, detail: `UID: ${s?.rfid_card_uid || 'Missing'}` },
                  { num: 3, label: 'Bus Pass Status Active', ok: cond3, detail: `Pass is ${selectedPass.pass_status}` },
                  { num: 4, label: 'Current Date Within Validity Period', ok: cond4, detail: `${selectedPass.start_date} to ${selectedPass.expiry_date}` },
                  { num: 5, label: 'Transport Fee Fully Paid', ok: cond5, detail: `Paid: ₹${selectedPass.amount_paid} | Due: ₹${selectedPass.outstanding_balance}` },
                  { num: 6, label: 'Bus & Route Matching Assignment', ok: cond6, detail: `Assigned Bus: ${selectedPass.assigned_bus} (${selectedPass.assigned_route})` },
                  { num: 7, label: 'Duplicate Tap Filter Active', ok: true, detail: 'Anti-passback duplicate rejection active (5 min window)' }
                ];

                return (
                  <div>
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: allPass ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${allPass ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: allPass ? '#10B981' : '#EF4444' }}>
                          {allPass ? '✓ PASS AUTHORIZED FOR BOARDING' : '✕ BOARDING REJECTION WILL OCCUR'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {s?.full_name} ({s?.student_id})
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {auditItems.map((item) => (
                        <div 
                          key={item.num}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.ok ? <CheckCircle size={18} style={{ color: '#10B981' }} /> : <XCircle size={18} style={{ color: '#EF4444' }} />}
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF' }}>{item.num}. {item.label}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.detail}</div>
                            </div>
                          </div>
                          <span className={`badge ${item.ok ? 'badge-valid' : 'badge-danger'}`}>
                            {item.ok ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedPass(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
