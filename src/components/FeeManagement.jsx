import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  CreditCard, 
  Receipt, 
  CheckCircle, 
  Download, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { db } from '../services/db';

export default function FeeManagement({ data, onRefresh, role }) {
  const payments = data.payments || [];
  const students = data.students || [];
  const passes = data.bus_passes || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    pass_id: '',
    amount: '',
    payment_method: 'UPI',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState('');

  // Total finances
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstanding = passes.reduce((sum, p) => sum + Number(p.outstanding_balance || 0), 0);
  const paidCount = students.filter(s => s.fee_payment_status === 'Paid').length;
  const unpaidCount = students.filter(s => s.fee_payment_status !== 'Paid').length;

  const filteredPayments = payments.filter((p) => {
    const student = students.find((s) => s.student_id === p.student_id);
    const matchesSearch = 
      p.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleOpenAdd = () => {
    setFormError('');
    const firstUnpaid = passes.find(p => p.outstanding_balance > 0) || passes[0];
    setPaymentForm({
      student_id: firstUnpaid?.student_id || students[0]?.student_id || '',
      pass_id: firstUnpaid?.pass_id || '',
      amount: firstUnpaid?.outstanding_balance || 18000,
      payment_method: 'UPI',
      transaction_reference: `UPI/${Date.now().toString().slice(-6)}`,
      payment_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleStudentSelect = (studentId) => {
    const pass = passes.find(p => p.student_id === studentId);
    setPaymentForm(prev => ({
      ...prev,
      student_id: studentId,
      pass_id: pass?.pass_id || '',
      amount: pass ? pass.outstanding_balance : 18000
    }));
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    setFormError('');

    if (!paymentForm.student_id || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setFormError('Please select a student and provide a valid payment amount (> 0).');
      return;
    }

    try {
      db.recordPayment(paymentForm);
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const canEdit = role === 'Super Admin' || role === 'Fee Administrator';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            College Transport Fee Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time transport fee receipts, balance reconciliation, and instant RFID pass authorization.
          </p>
        </div>

        {canEdit && (
          <button onClick={handleOpenAdd} className="btn btn-teal btn-sm">
            <Plus size={15} /> Record Payment
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Fees Collected</div>
          <div className="stat-value" style={{ color: 'var(--status-valid)' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div className="stat-sub">{payments.length} verified transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Outstanding Dues</div>
          <div className="stat-value" style={{ color: '#EF4444' }}>
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div className="stat-sub">{unpaidCount} students pending payment</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Paid Students</div>
          <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{paidCount}</div>
          <div className="stat-sub">Passes cleared for boarding</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unpaid Students</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{unpaidCount}</div>
          <div className="stat-sub">RFID reader will reject with FEES_PENDING</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="table-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by Payment ID, Student, Ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash / Admin Desk">Cash / Admin Desk</option>
          </select>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Student</th>
                <th>Student ID</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Transaction Ref</th>
                <th>Date</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const s = students.find((st) => st.student_id === p.student_id);
                return (
                  <tr key={p.payment_id}>
                    <td>
                      <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-teal)' }}>
                        {p.payment_id}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s?.full_name || 'N/A'}</td>
                    <td><code>{p.student_id}</code></td>
                    <td style={{ fontWeight: 700, color: '#10B981' }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td>{p.payment_method}</td>
                    <td><code style={{ fontSize: '11.5px' }}>{p.transaction_reference}</code></td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{p.payment_date}</td>
                    <td>
                      <span className="badge badge-valid">{p.verification_status}</span>
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedReceipt({ ...p, student_name: s?.full_name, dept: s?.department })}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11.5px' }}
                      >
                        <Receipt size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Record Student Bus Fee Payment
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select 
                    className="form-control" 
                    value={paymentForm.student_id} 
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    required
                  >
                    {students.map((s) => {
                      const pass = passes.find(p => p.student_id === s.student_id);
                      return (
                        <option key={s.student_id} value={s.student_id}>
                          {s.full_name} ({s.student_id}) - Due: ₹{pass?.outstanding_balance || 0}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Payment Amount (₹) *</label>
                    <input 
                      type="number" 
                      min="100" 
                      max="50000"
                      className="form-control" 
                      value={paymentForm.amount} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    <select 
                      className="form-control" 
                      value={paymentForm.payment_method} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Credit Card">Credit Card / Debit Card</option>
                      <option value="Cash / Admin Desk">Cash / Campus Admin Desk</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Transaction Reference Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UPI/260810/9981" 
                      className="form-control" 
                      value={paymentForm.transaction_reference} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={paymentForm.payment_date} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 208, 156, 0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(0, 208, 156, 0.2)', fontSize: '12.5px', color: '#CBD5E1' }}>
                  Recording this payment will automatically update the student's fee status to <strong>Paid</strong> and enable RFID card boarding at hardware readers.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Confirm & Issue Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Transport Fee Receipt
              </h3>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div className="modal-body" style={{ background: '#080E15', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>SMARTPASSFLOW TRANSPORT OFFICE</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Transport Fee Voucher & RFID Authorization</div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-strong)', borderBottom: '1px dashed var(--border-strong)', padding: '16px 0', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Receipt No:</span>
                  <strong>{selectedReceipt.payment_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student:</span>
                  <strong>{selectedReceipt.student_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student ID:</span>
                  <code>{selectedReceipt.student_id}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Date:</span>
                  <span>{selectedReceipt.payment_date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                  <span>{selectedReceipt.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Txn Reference:</span>
                  <code>{selectedReceipt.transaction_reference}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '16px' }}>
                  <strong>Amount Paid:</strong>
                  <strong style={{ color: 'var(--accent-teal)' }}>₹{Number(selectedReceipt.amount).toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--status-valid)' }}>
                ✓ Verified & Synchronized with Hardware Readers
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedReceipt(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
