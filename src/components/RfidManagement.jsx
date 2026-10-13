import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  History,
  AlertTriangle
} from 'lucide-react';
import { db } from '../services/db';

export default function RfidManagement({ data, onRefresh, role }) {
  const cards = data.rfid_cards || [];
  const students = data.students || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [selectedCardForReplace, setSelectedCardForReplace] = useState(null);

  const [newCardData, setNewCardData] = useState({ card_uid: '', student_id: '', card_status: 'Active' });
  const [replaceData, setReplaceData] = useState({ new_card_uid: '' });
  const [modalError, setModalError] = useState('');

  const filteredCards = cards.filter((c) => {
    const student = students.find((s) => s.student_id === c.student_id);
    const matchesSearch = 
      c.card_uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.student_id && c.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || c.card_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRegisterCard = (e) => {
    e.preventDefault();
    setModalError('');
    if (!newCardData.card_uid.trim()) {
      setModalError('Card UID is required.');
      return;
    }

    try {
      db.registerCard({
        card_uid: newCardData.card_uid.trim().toUpperCase(),
        student_id: newCardData.student_id || null,
        card_status: newCardData.card_status
      });
      setIsRegisterOpen(false);
      onRefresh();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleBlockCard = (cardUid) => {
    if (confirm(`Block RFID card ${cardUid}? This card will immediately be rejected at all bus readers.`)) {
      db.updateCardStatus(cardUid, 'Blocked');
      onRefresh();
    }
  };

  const handleReplaceCard = (e) => {
    e.preventDefault();
    setModalError('');
    if (!replaceData.new_card_uid.trim()) {
      setModalError('New Card UID is required.');
      return;
    }

    try {
      db.replaceCard(selectedCardForReplace.card_uid, replaceData.new_card_uid.trim().toUpperCase(), selectedCardForReplace.student_id);
      setIsReplaceOpen(false);
      onRefresh();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            RFID Card Registry & Security
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Register 13.56MHz Mifare smart cards, link to student profiles, block stolen cards, and issue replacements.
          </p>
        </div>

        {canEdit && (
          <button 
            onClick={() => {
              setModalError('');
              setNewCardData({ card_uid: '', student_id: '', card_status: 'Active' });
              setIsRegisterOpen(true);
            }} 
            className="btn btn-teal btn-sm"
          >
            <Plus size={15} /> Register New Card
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="table-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by Card UID, Student name, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Card Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
            <option value="Lost">Lost</option>
            <option value="Replaced">Replaced</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
            Total Cards: <strong>{cards.length}</strong> · Active: <strong>{cards.filter(c => c.card_status === 'Active').length}</strong>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Card UID</th>
                <th>Associated Student</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th>Assigned Bus</th>
                <th>Last Tap Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => {
                const student = students.find((s) => s.student_id === card.student_id || s.rfid_card_uid === card.card_uid);

                return (
                  <tr key={card.card_uid}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-teal)' }}>
                        <CreditCard size={14} />
                        {card.card_uid}
                      </span>
                    </td>
                    <td>
                      {student ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.student_id} · {student.department}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Unassigned Pool</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        card.card_status === 'Active' ? 'badge-valid' : 
                        card.card_status === 'Blocked' || card.card_status === 'Lost' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {card.card_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {new Date(card.registered_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge badge-info">{student?.assigned_bus || 'N/A'}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {card.last_tap_at ? new Date(card.last_tap_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {card.card_status === 'Active' && (
                            <>
                              <button 
                                onClick={() => handleBlockCard(card.card_uid)}
                                className="btn btn-outline btn-sm" 
                                style={{ padding: '4px 8px', color: 'var(--status-danger)' }}
                                title="Block Card"
                              >
                                <ShieldAlert size={13} /> Block
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedCardForReplace(card);
                                  setReplaceData({ new_card_uid: '' });
                                  setModalError('');
                                  setIsReplaceOpen(true);
                                }}
                                className="btn btn-outline btn-sm" 
                                style={{ padding: '4px 8px' }}
                                title="Replace Lost Card"
                              >
                                <RefreshCw size={13} /> Replace
                              </button>
                            </>
                          )}
                          {card.card_status === 'Blocked' && (
                            <button 
                              onClick={() => {
                                db.updateCardStatus(card.card_uid, 'Active');
                                onRefresh();
                              }}
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '4px 8px', color: 'var(--status-valid)' }}
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Card Modal */}
      {isRegisterOpen && (
        <div className="modal-overlay" onClick={() => setIsRegisterOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Register RFID Card
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleRegisterCard}>
              <div className="modal-body">
                {modalError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                    {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">RFID Card UID (Hex string from ESP32 reader) *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 04A1B2C3" 
                    className="form-control" 
                    value={newCardData.card_uid} 
                    onChange={(e) => setNewCardData({ ...newCardData, card_uid: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign to Student (Optional)</label>
                  <select 
                    className="form-control" 
                    value={newCardData.student_id} 
                    onChange={(e) => setNewCardData({ ...newCardData, student_id: e.target.value })}
                  >
                    <option value="">-- Leave in Unassigned Pool --</option>
                    {students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.full_name} ({s.student_id}) - {s.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Card Status</label>
                  <select 
                    className="form-control" 
                    value={newCardData.card_status} 
                    onChange={(e) => setNewCardData({ ...newCardData, card_status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Register Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Card Modal */}
      {isReplaceOpen && selectedCardForReplace && (
        <div className="modal-overlay" onClick={() => setIsReplaceOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Replace Lost / Damaged RFID Card
              </h3>
              <button onClick={() => setIsReplaceOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleReplaceCard}>
              <div className="modal-body">
                {modalError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                    {modalError}
                  </div>
                )}

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  Current Card: <strong>{selectedCardForReplace.card_uid}</strong> will be permanently marked as <strong>Replaced</strong> and deactivated.
                </div>

                <div className="form-group">
                  <label className="form-label">New RFID Card UID *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 78AC01FE" 
                    className="form-control" 
                    value={replaceData.new_card_uid} 
                    onChange={(e) => setReplaceData({ ...replaceData, new_card_uid: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsReplaceOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Issue Replacement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
