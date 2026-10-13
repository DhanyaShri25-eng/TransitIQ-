import React, { useState } from 'react';
import { 
  RefreshCw, 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  UploadCloud, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { syncOfflineBatch, soundFx } from '../services/rfidEngine';

export default function OfflineSync({ data, onRefresh }) {
  const devices = data.devices || [];
  const buses = data.buses || [];

  const [selectedDevice, setSelectedDevice] = useState(devices[1]?.device_id || 'ESP32-BUS-002');
  const [offlineQueue, setOfflineQueue] = useState([
    { event_id: 'EVT-OFF-101', card_uid: 'E2000019', timestamp: new Date(Date.now() - 7200000).toISOString(), note: 'Tapped during tunnel signal loss' },
    { event_id: 'EVT-OFF-102', card_uid: 'A489C132', timestamp: new Date(Date.now() - 5400000).toISOString(), note: 'Buffered at North Campus gate' },
    { event_id: 'EVT-OFF-103', card_uid: '5C778F2A', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Buffered at Outer Ring Road' },
    { event_id: 'EVT-9001', card_uid: 'E2000019', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), note: 'Retransmitted duplicate packet' }
  ]);

  const [syncHistory, setSyncHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);

    setTimeout(() => {
      const dev = devices.find(d => d.device_id === selectedDevice);
      const busId = dev?.assigned_bus || 'BUS-102';

      const result = syncOfflineBatch(selectedDevice, busId, offlineQueue);
      setSyncHistory([
        {
          id: `BATCH-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          device_id: selectedDevice,
          bus_id: busId,
          received: result.totalReceived,
          processed: result.processedCount,
          duplicates: result.duplicatesIgnored
        },
        ...syncHistory
      ]);

      setOfflineQueue([]);
      setIsSyncing(false);
      onRefresh();
      soundFx.playBeep('VALID');
    }, 1200);
  };

  const handleAddSimulatedScan = () => {
    const id = `EVT-OFF-${Math.floor(100 + Math.random() * 900)}`;
    setOfflineQueue(prev => [
      ...prev,
      {
        event_id: id,
        card_uid: 'B23490AC',
        timestamp: new Date().toISOString(),
        note: 'New offline card tap buffered to SD'
      }
    ]);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            MicroSD Offline Storage & Cloud Synchronization Engine
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Ensures college bus scanners function with zero internet. Original tap timestamps are preserved without duplicate boarding inflation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAddSimulatedScan} className="btn btn-outline btn-sm">
            <HardDrive size={14} /> Add Offline Tap to SD
          </button>
          <button 
            onClick={handleTriggerSync} 
            disabled={offlineQueue.length === 0 || isSyncing} 
            className="btn btn-teal btn-sm"
          >
            <UploadCloud size={15} /> {isSyncing ? 'Synchronizing...' : `Sync Batch (${offlineQueue.length} Scans)`}
          </button>
        </div>
      </div>

      {/* Workflow Explanation Banner */}
      <div style={{
        background: 'rgba(14, 165, 233, 0.08)',
        border: '1px solid rgba(14, 165, 233, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
          <div>
            <strong style={{ color: '#FFF' }}>1. Local SD Buffering:</strong> When Wi-Fi disconnects, the ESP32 logs taps to MicroSD FAT32 storage with monotonic event IDs.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
          <div>
            <strong style={{ color: '#FFF' }}>2. Idempotent Ingestion:</strong> On network restoration, the batch is uploaded. The cloud checks event IDs to prevent duplicate passenger counts.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</div>
          <div>
            <strong style={{ color: '#FFF' }}>3. Timestamp Preservation:</strong> The original tap timestamp is locked as <code>event_timestamp</code>, preserving actual boarding history.
          </div>
        </div>
      </div>

      {/* Active Queue Table */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-header-bar">
          <div className="table-title">
            <HardDrive size={18} style={{ color: '#F59E0B' }} />
            <span>Pending MicroSD Card Queue ({offlineQueue.length} records awaiting upload)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Device:</span>
            <select 
              className="select-filter"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>{d.device_name} ({d.assigned_bus})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Card UID</th>
                <th>Original Tap Timestamp (Hardware RTC)</th>
                <th>Buffer Condition / Note</th>
                <th>Idempotency Status</th>
              </tr>
            </thead>
            <tbody>
              {offlineQueue.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    All local records are synchronized. No pending items in MicroSD queue.
                  </td>
                </tr>
              ) : (
                offlineQueue.map((item, idx) => {
                  const isDup = data.boarding_records?.some(r => r.event_id === item.event_id);

                  return (
                    <tr key={idx}>
                      <td><code>{item.event_id}</code></td>
                      <td><code style={{ color: 'var(--accent-teal)' }}>{item.card_uid}</code></td>
                      <td style={{ fontSize: '12.5px' }}>{new Date(item.timestamp).toLocaleString()}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.note}</td>
                      <td>
                        <span className={`badge ${isDup ? 'badge-warning' : 'badge-valid'}`}>
                          {isDup ? 'Duplicate - Will Ignore' : 'New Unprocessed Scan'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync History Audit Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <Clock size={18} style={{ color: 'var(--accent-teal)' }} />
            <span>Completed Batch Synchronization History</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Run</th>
                <th>Sync Time</th>
                <th>Source Device</th>
                <th>Bus Target</th>
                <th>Total Uploaded</th>
                <th>New Boardings Added</th>
                <th>Duplicates Prevented</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {syncHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No sync batches executed during this session.
                  </td>
                </tr>
              ) : (
                syncHistory.map((run) => (
                  <tr key={run.id}>
                    <td><code>{run.id}</code></td>
                    <td style={{ fontSize: '12.5px' }}>{new Date(run.timestamp).toLocaleTimeString()}</td>
                    <td>{run.device_id}</td>
                    <td>{run.bus_id}</td>
                    <td>{run.received}</td>
                    <td style={{ fontWeight: 700, color: 'var(--status-valid)' }}>+{run.processed}</td>
                    <td style={{ color: '#F59E0B' }}>{run.duplicates} ignored</td>
                    <td>
                      <span className="badge badge-valid">Success (ACK)</span>
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
