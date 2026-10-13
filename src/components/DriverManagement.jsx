import React, { useState } from 'react';
import { UserCheck, Plus, Edit2, Phone, Award, Bus, MapPin } from 'lucide-react';
import { db } from '../services/db';

export default function DriverManagement({ data, onRefresh, role }) {
  const drivers = data.drivers || [];
  const buses = data.buses || [];
  const routes = data.routes || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    driver_id: '',
    full_name: '',
    phone: '',
    license_number: '',
    assigned_bus: 'BUS-101',
    assigned_route: 'RT-1',
    employment_status: 'Active'
  });
  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormError('');
    setFormData({
      driver_id: `DRV-${String(drivers.length + 1).padStart(3, '0')}`,
      full_name: '',
      phone: '+91 99001 ',
      license_number: 'KA04-',
      assigned_bus: buses[0]?.bus_id || 'BUS-101',
      assigned_route: routes[0]?.route_id || 'RT-1',
      employment_status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormError('');
    setFormData({ ...driver });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingDriver) {
        db.updateDriver(editingDriver.driver_id, formData);
      } else {
        db.addDriver(formData);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            Driver Accounts & Bus Assignments
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage campus bus drivers, verified heavy motor vehicle licenses, and route rosters.
          </p>
        </div>

        {canEdit && (
          <button onClick={handleOpenAdd} className="btn btn-teal btn-sm">
            <Plus size={15} /> Add Driver
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {drivers.map((drv) => {
          const bus = buses.find((b) => b.bus_id === drv.assigned_bus);
          const route = routes.find((r) => r.route_id === drv.assigned_route);

          return (
            <div 
              key={drv.driver_id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(0, 208, 156, 0.15)',
                    color: 'var(--accent-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 700
                  }}>
                    {drv.full_name[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>{drv.full_name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {drv.driver_id}</div>
                  </div>
                </div>

                <span className={`badge ${drv.employment_status === 'Active' ? 'badge-valid' : 'badge-warning'}`}>
                  {drv.employment_status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px', background: 'rgba(0, 0, 0, 0.2)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Phone size={14} style={{ color: 'var(--accent-teal)' }} />
                  <span>{drv.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Award size={14} style={{ color: '#F59E0B' }} />
                  <span>License: {drv.license_number}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Assigned Bus</span>
                  <strong>{bus?.bus_number || drv.assigned_bus}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Assigned Route</span>
                  <strong>{route?.route_name || drv.assigned_route}</strong>
                </div>
              </div>

              {canEdit && (
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(drv)} className="btn btn-outline btn-sm">
                    <Edit2 size={13} /> Edit Account
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                {editingDriver ? 'Edit Driver Record' : 'Register New Driver'}
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
                    <label className="form-label">Driver ID *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.driver_id} 
                      disabled={!!editingDriver}
                      onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.full_name} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Commercial License Number *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.license_number} 
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Assigned Bus</label>
                    <select className="form-control" value={formData.assigned_bus} onChange={(e) => setFormData({ ...formData, assigned_bus: e.target.value })}>
                      {buses.map((b) => (
                        <option key={b.bus_id} value={b.bus_id}>{b.bus_number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Route</label>
                    <select className="form-control" value={formData.assigned_route} onChange={(e) => setFormData({ ...formData, assigned_route: e.target.value })}>
                      {routes.map((r) => (
                        <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
