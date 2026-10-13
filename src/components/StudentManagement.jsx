import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Trash2, 
  Edit2, 
  ChevronDown,
  X
} from 'lucide-react';
import { db } from '../services/db';

export default function StudentManagement({ data, onRefresh, role }) {
  const students = data.students || [];
  const buses = data.buses || [];
  const routes = data.routes || [];

  // Filter States matching Screenshot 1
  const [searchTerm, setSearchTerm] = useState('');
  const [busFilter, setBusFilter] = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [passFilter, setPassFilter] = useState('ALL');
  const [parentMobileFilter, setParentMobileFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    department: 'B.Tech AI&DS',
    year_of_study: '3rd Year',
    section: 'A',
    phone: '',
    parent_name: '',
    parent_relation: 'Father',
    parent_mobile: '',
    stop_name: 'Periyaar Nagar',
    tag: '',
    email: '',
    rfid_card_uid: '',
    assigned_bus: '54',
    assigned_route: 'Periyar Nagar',
    bus_pass_status: 'Active',
    fee_payment_status: 'Unpaid'
  });
  const [formError, setFormError] = useState('');

  // Filtering
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      !searchTerm ||
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stop_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBus = busFilter === 'ALL' || s.assigned_bus === busFilter;
    const matchesRoute = routeFilter === 'ALL' || s.assigned_route === routeFilter;
    const matchesYear = yearFilter === 'ALL' || s.year_of_study === yearFilter;
    const matchesPass = passFilter === 'ALL' || s.bus_pass_status === passFilter;
    const matchesParentMobile = !parentMobileFilter || (s.parent_mobile && s.parent_mobile.includes(parentMobileFilter));

    return matchesSearch && matchesBus && matchesRoute && matchesYear && matchesPass && matchesParentMobile;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setBusFilter('ALL');
    setRouteFilter('ALL');
    setYearFilter('ALL');
    setPassFilter('ALL');
    setParentMobileFilter('');
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormError('');
    setFormData({
      student_id: `732224AI0${Math.floor(60 + Math.random() * 30)}`,
      full_name: '',
      department: 'B.Tech AI&DS',
      year_of_study: '3rd Year',
      section: 'A',
      phone: '+91 ',
      parent_name: '',
      parent_relation: 'Father',
      parent_mobile: '',
      stop_name: 'Periyaar Nagar',
      tag: '',
      email: '',
      rfid_card_uid: `E2${Math.floor(100000 + Math.random() * 899999)}`,
      assigned_bus: '54',
      assigned_route: 'Periyar Nagar',
      bus_pass_status: 'Active',
      fee_payment_status: 'Unpaid'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormError('');
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.student_id || !formData.full_name) {
      setFormError('Student ID and Full Name are required.');
      return;
    }

    try {
      if (editingStudent) {
        db.updateStudent(editingStudent.student_id, formData);
      } else {
        db.addStudent(formData);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = (studentId, studentName) => {
    if (confirm(`Are you sure you want to delete student "${studentName}" (${studentId})?`)) {
      db.deleteStudent(studentId);
      onRefresh();
    }
  };

  const exportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Department', 'Year', 'Bus', 'Route', 'Stop', 'Parent Name', 'Parent Mobile', 'Fees', 'Pass Status'];
    const rows = filteredStudents.map((s) => [
      s.student_id,
      `"${s.full_name}"`,
      s.department,
      s.year_of_study,
      s.assigned_bus,
      s.assigned_route,
      `"${s.stop_name || ''}"`,
      `"${s.parent_name || ''}"`,
      s.parent_mobile || '',
      s.fee_payment_status,
      s.bus_pass_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transitiq_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
          Students
        </h1>
      </div>

      {/* Top Action Toolbar matching Screenshot 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '999px',
              background: 'var(--accent-teal)',
              color: '#061D15',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 16px var(--accent-teal-glow)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add record</span>
          </button>
        )}

        <button 
          onClick={exportCSV}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: 'transparent',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            cursor: 'pointer'
          }}
        >
          Export CSV
        </button>

        <button 
          onClick={() => alert('Import CSV: Select student batch spreadsheet to import.')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: 'transparent',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            cursor: 'pointer'
          }}
        >
          Import
        </button>

        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input 
            type="text"
            placeholder="Search records"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '999px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Filter Rows matching Screenshot 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {/* All buses */}
        <div style={{ position: 'relative' }}>
          <select 
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '8px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '13.5px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All buses</option>
            {buses.map((b) => (
              <option key={b.bus_id} value={b.bus_number}>Bus {b.bus_number}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>

        {/* All routes */}
        <div style={{ position: 'relative' }}>
          <select 
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '8px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '13.5px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All routes</option>
            {routes.map((r) => (
              <option key={r.route_id} value={r.route_name}>{r.route_name}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>

        {/* All years */}
        <div style={{ position: 'relative' }}>
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '8px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '13.5px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>

        {/* All pass statuses */}
        <div style={{ position: 'relative' }}>
          <select 
            value={passFilter}
            onChange={(e) => setPassFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '8px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '13.5px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All pass statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>

        {/* Parent mobile filter */}
        <div style={{ position: 'relative' }}>
          <input 
            type="text"
            placeholder="Parent mobile filter"
            value={parentMobileFilter}
            onChange={(e) => setParentMobileFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '8px',
              background: '#091018',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#CBD5E1',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>
      </div>

      {/* Clear Filters Button matching Screenshot 1 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button 
          onClick={handleClearFilters}
          style={{
            padding: '9px 36px',
            borderRadius: '999px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Clear filters
        </button>
      </div>

      {/* Table matching Screenshot 1 */}
      <div style={{
        background: '#0D1520',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'transparent' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Student</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Student ID</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Department</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Bus</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Year</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
                    No students matched the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.student_id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', verticalAlign: 'top' }}
                  >
                    {/* Student Column with Multiline Details */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#FFFFFF', letterSpacing: '0.2px' }}>
                        {student.full_name}
                      </div>

                      {student.tag && (
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                          · {student.tag}
                        </div>
                      )}

                      <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.5 }}>
                        Parent: {student.parent_name || 'N/A'} · {student.parent_relation || 'Father'}
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.5 }}>
                        Parent mobile: {student.parent_mobile || student.phone || 'N/A'}
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.5 }}>
                        Stop: {student.stop_name || 'Campus Gate'} · Fees: {student.fee_payment_status || 'Unpaid'}
                      </div>
                    </td>

                    {/* Student ID */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', fontWeight: 500, color: '#FFFFFF' }}>
                      {student.student_id}
                    </td>

                    {/* Department */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {student.department}
                    </td>

                    {/* Bus */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {student.assigned_bus}
                    </td>

                    {/* Year */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {student.year_of_study}
                    </td>

                    {/* Actions matching Screenshot 1 pills */}
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleOpenEdit(student)}
                              style={{
                                padding: '6px 18px',
                                borderRadius: '999px',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#FFFFFF',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(student.student_id, student.full_name)}
                              style={{
                                padding: '6px 18px',
                                borderRadius: '999px',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#FFFFFF',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                {editingStudent ? 'Edit Student Record' : 'Add Student Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', padding: '10px 14px', borderRadius: '8px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Student ID (Roll No) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 732224AI020"
                      value={formData.student_id} 
                      disabled={!!editingStudent}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. DHANYA SHRI.A.C"
                      value={formData.full_name} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value.toUpperCase() })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. B.Tech AI&DS"
                      value={formData.department} 
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select className="form-control" value={formData.year_of_study} onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Parent / Guardian Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. CHINNASAMY.A"
                      className="form-control" 
                      value={formData.parent_name} 
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Mobile Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 9944847680"
                      className="form-control" 
                      value={formData.parent_mobile} 
                      onChange={(e) => setFormData({ ...formData, parent_mobile: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Boarding Stop Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Periyaar Nagar"
                      className="form-control" 
                      value={formData.stop_name} 
                      onChange={(e) => setFormData({ ...formData, stop_name: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bus Tag (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BUS67-COMMON"
                      className="form-control" 
                      value={formData.tag} 
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Assigned Bus Number *</label>
                    <select className="form-control" value={formData.assigned_bus} onChange={(e) => setFormData({ ...formData, assigned_bus: e.target.value })}>
                      {buses.map((b) => (
                        <option key={b.bus_id} value={b.bus_number}>Bus {b.bus_number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">RFID Card UID (Hex)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. E2000019" 
                      className="form-control" 
                      value={formData.rfid_card_uid} 
                      onChange={(e) => setFormData({ ...formData, rfid_card_uid: e.target.value.toUpperCase() })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Fee Status</label>
                    <select className="form-control" value={formData.fee_payment_status} onChange={(e) => setFormData({ ...formData, fee_payment_status: e.target.value })}>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bus Pass Status</label>
                    <select className="form-control" value={formData.bus_pass_status} onChange={(e) => setFormData({ ...formData, bus_pass_status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-teal">
                  {editingStudent ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
