import React, { useState } from 'react';
import { 
  Plus, 
  ChevronDown, 
  Search, 
  Trash2, 
  Edit2, 
  History 
} from 'lucide-react';
import { db } from '../services/db';

export default function BusManagement({ data, onRefresh, role, onOpenSimulator }) {
  const buses = data.buses || [];
  const routes = data.routes || [];
  const drivers = data.drivers || [];
  const records = data.boarding_records || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [historyBus, setHistoryBus] = useState(null);

  const [formData, setFormData] = useState({
    bus_id: '',
    bus_number: '',
    registration_number: '',
    capacity: 62,
    assigned_route: 'Periyar Nagar',
    assigned_driver: 'DRV-001',
    driver_name: 'Ramesh Kumar',
    device_id: 'ESP32-BUS-054',
    bus_status: 'Active'
  });
  const [formError, setFormError] = useState('');

  // Total Fleet Verified Passengers
  const totalVerifiedPassengers = records.filter(r => r.verification_status === 'VALID').length;
  const totalFleetCapacity = buses.reduce((sum, b) => sum + (Number(b.capacity) || 62), 0);

  const filteredBuses = buses.filter((b) => {
    const matchesSearch = 
      !searchTerm ||
      b.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.assigned_route && b.assigned_route.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.driver_name && b.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || b.bus_status === statusFilter;
    const matchesRoute = routeFilter === 'ALL' || b.assigned_route === routeFilter;

    return matchesSearch && matchesStatus && matchesRoute;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setRouteFilter('ALL');
  };

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormError('');
    const newNum = String(Math.floor(70 + Math.random() * 20));
    setFormData({
      bus_id: newNum,
      bus_number: newNum,
      registration_number: `${newNum} · 1003 · Active`,
      capacity: 62,
      assigned_route: routes[0]?.route_name || 'Periyar Nagar',
      assigned_driver: drivers[0]?.driver_id || 'DRV-001',
      driver_name: drivers[0]?.full_name || 'Ramesh Kumar',
      device_id: `ESP32-BUS-0${newNum}`,
      bus_status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setFormError('');
    setFormData({ ...bus });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const drv = drivers.find(d => d.driver_id === formData.assigned_driver || d.full_name === formData.driver_name);

      const payload = {
        ...formData,
        driver_name: drv ? drv.full_name : formData.driver_name
      };

      if (editingBus) {
        db.updateBus(editingBus.bus_id, payload);
      } else {
        db.addBus({
          ...payload,
          current_boarding_count: 0,
          last_device_communication: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = (busId, busNum) => {
    if (confirm(`Are you sure you want to delete Bus ${busNum}?`)) {
      db.deleteBus(busId);
      onRefresh();
    }
  };

  const exportCSV = () => {
    const headers = ['Bus', 'Registration', 'Route', 'Driver', 'Capacity', 'RFID-Verified Passengers', 'Status'];
    const rows = filteredBuses.map((b) => [
      b.bus_number,
      `"${b.registration_number}"`,
      `"${b.assigned_route}"`,
      `"${b.driver_name}"`,
      b.capacity,
      b.current_boarding_count || 0,
      b.bus_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transitiq_buses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = role !== 'Read-Only Viewer';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Title matching Screenshot 2 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
          Buses
        </h1>
      </div>

      {/* Top Metric Card matching Screenshot 2 */}
      <div style={{
        background: '#0D1520',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
          RFID-Verified Passengers
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '38px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
          {totalVerifiedPassengers}
        </div>
      </div>

      {/* Action Buttons Toolbar matching Screenshot 2 */}
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
          onClick={() => alert('Import CSV: Select bus fleet spreadsheet to import.')}
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

      {/* Stacked Filter Dropdowns matching Screenshot 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        <div style={{ position: 'relative' }}>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="ALL">All statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
        </div>

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
      </div>

      {/* Clear Filters Button matching Screenshot 2 */}
      <div style={{ marginBottom: '24px' }}>
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

      {/* Buses Table matching Screenshot 2 */}
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
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Bus</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Route</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>Driver</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>RFID-Verified Passengers</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.map((bus) => {
                const busRecords = records.filter(r => (r.bus_id === bus.bus_id || r.bus_id === bus.bus_number) && r.verification_status === 'VALID');
                const verifiedCount = bus.current_boarding_count || busRecords.length || 0;

                return (
                  <tr 
                    key={bus.bus_id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', verticalAlign: 'middle' }}
                  >
                    {/* Bus Number & Subtext */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF' }}>
                        {bus.bus_number}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                        {bus.registration_number || `${bus.bus_number} · 1001 · Active`}
                      </div>
                    </td>

                    {/* Route */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {bus.assigned_route}
                    </td>

                    {/* Driver */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF' }}>
                      {bus.driver_name || 'Ramesh Kumar'}
                    </td>

                    {/* RFID-Verified Passengers */}
                    <td style={{ padding: '18px 20px', fontSize: '13.5px', color: '#FFFFFF', fontWeight: 600 }}>
                      {verifiedCount}
                    </td>

                    {/* Actions matching Screenshot 2: Edit, Delete, Scan history */}
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleOpenEdit(bus)}
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
                              onClick={() => handleDelete(bus.bus_id, bus.bus_number)}
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
                        <button 
                          onClick={() => setHistoryBus(bus)}
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
                          Scan history
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom fleet capacity disclaimer matching Screenshot 2 */}
      <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '12px' }}>
        Fleet capacity: {totalFleetCapacity} seats. Verification totals do not measure exact occupancy.
      </div>

      {/* Add / Edit Bus Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                {editingBus ? 'Edit Bus Record' : 'Add Bus Record'}
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
                    <label className="form-label">Bus Number *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 54"
                      value={formData.bus_number} 
                      onChange={(e) => setFormData({ ...formData, bus_number: e.target.value, bus_id: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration / Label *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 54 · 1001 · Active"
                      value={formData.registration_number} 
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Route *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Periyar Nagar"
                      value={formData.assigned_route} 
                      onChange={(e) => setFormData({ ...formData, assigned_route: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Driver *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.driver_name} 
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bus Seating Capacity</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.capacity} 
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bus Status</label>
                    <select className="form-control" value={formData.bus_status} onChange={(e) => setFormData({ ...formData, bus_status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Standby">Standby</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-teal">Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan History Modal */}
      {historyBus && (
        <div className="modal-overlay" onClick={() => setHistoryBus(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Scan History — Bus {historyBus.bus_number}
              </h3>
              <button onClick={() => setHistoryBus(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Student Name</th>
                    <th>Card UID</th>
                    <th>Timestamp</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.bus_id === historyBus.bus_id || r.bus_id === historyBus.bus_number).length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                        No tap scans logged yet for Bus {historyBus.bus_number}. Tap cards via the hardware simulator to test!
                      </td>
                    </tr>
                  ) : (
                    records.filter(r => r.bus_id === historyBus.bus_id || r.bus_id === historyBus.bus_number).map((r) => (
                      <tr key={r.event_id}>
                        <td><code>{r.event_id}</code></td>
                        <td><strong>{r.student_name}</strong></td>
                        <td><code>{r.card_uid}</code></td>
                        <td>{new Date(r.event_timestamp).toLocaleTimeString()}</td>
                        <td>
                          <span className={`badge ${r.verification_status === 'VALID' ? 'badge-valid' : 'badge-danger'}`}>
                            {r.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button onClick={() => setHistoryBus(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
