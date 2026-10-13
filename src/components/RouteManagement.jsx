import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { db } from '../services/db';

export default function RouteManagement({ data, onRefresh, role }) {
  const routes = data.routes || [];
  const students = data.students || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [formData, setFormData] = useState({
    route_id: '',
    route_name: '',
    service: 'Morning & Evening',
    students_count: 0,
    route_status: 'Active'
  });
  const [formError, setFormError] = useState('');

  const filteredRoutes = routes.filter((r) => 
    !searchTerm ||
    r.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.service && r.service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormError('');
    setFormData({
      route_id: `RT-${routes.length + 1}`,
      route_name: '',
      service: 'Morning & Evening',
      students_count: 0,
      route_status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setFormError('');
    setFormData({ ...route });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.route_name.trim()) {
      setFormError('Route name is required.');
      return;
    }

    try {
      if (editingRoute) {
        db.updateRoute(editingRoute.route_id, formData);
      } else {
        db.addRoute({
          ...formData,
          route_id: `RT-${Date.now().toString().slice(-4)}`
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = (routeId, routeName) => {
    if (confirm(`Are you sure you want to delete route "${routeName}"?`)) {
      db.deleteRoute(routeId);
      onRefresh();
    }
  };

  const exportCSV = () => {
    const headers = ['Route', 'Service', 'Students'];
    const rows = filteredRoutes.map((r) => [
      `"${r.route_name}"`,
      `"${r.service || ''}"`,
      r.students_count !== undefined ? r.students_count : students.filter(s => s.assigned_route === r.route_name).length
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transitiq_routes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title matching Screenshot 1 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
          Routes
        </h1>
      </div>

      {/* Toolbar matching Screenshot 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
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
              boxShadow: '0 0 16px var(--accent-teal-glow)'
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
            padding: '10px 28px',
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

      {/* Routes Table matching Screenshot 1 */}
      <div style={{
        background: '#0D1520',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div className="table-container">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Route</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Service</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Students</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((r) => {
                const count = r.students_count !== undefined ? r.students_count : students.filter(s => s.assigned_route === r.route_name).length;

                return (
                  <tr 
                    key={r.route_id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', verticalAlign: 'middle' }}
                  >
                    <td style={{ padding: '18px 24px', fontSize: '14px', color: '#FFFFFF', fontWeight: 500 }}>
                      {r.route_name}
                    </td>

                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {r.service || ''}
                    </td>

                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {count}
                    </td>

                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleOpenEdit(r)}
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
                              onClick={() => handleDelete(r.route_id, r.route_name)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sublink matching Screenshot 1 */}
      <div style={{ marginTop: '16px' }}>
        <span 
          style={{ 
            fontSize: '13.5px', 
            color: 'var(--accent-teal)', 
            cursor: 'pointer',
            fontWeight: 500
          }}
          onClick={() => alert('Manage ordered stops and timing: Configures stop geofences and timing schedules.')}
        >
          Manage ordered stops and timing
        </span>
      </div>

      {/* Add / Edit Route Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                {editingRoute ? 'Edit Route' : 'Add Route Record'}
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

                <div className="form-group">
                  <label className="form-label">Route Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Periyar Nagar"
                    className="form-control" 
                    value={formData.route_name} 
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Timing Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Morning & Evening"
                    className="form-control" 
                    value={formData.service} 
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
