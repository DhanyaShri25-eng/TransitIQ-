import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Users,
  CreditCard,
  Bus,
  MapPin,
  UserCheck,
  Ticket,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
  Cpu,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  History,
  Shield,
  Layers,
  Bell
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live-monitoring', label: 'Live Monitoring', icon: Radio },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'rfid-cards', label: 'RFID', icon: CreditCard },
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'routes', label: 'Routes', icon: MapPin },
  { id: 'bus-passes', label: 'Bus Passes', icon: Ticket },
  { id: 'boarding-records', label: 'Scan Records', icon: ClipboardList },
  { id: 'parent-fcm', label: 'Parent FCM Alerts', icon: Bell },
  { id: 'security-alerts', label: 'Wrong Bus Alerts', icon: AlertTriangle, hasAlertBadge: true },
  { id: 'offline-sync', label: 'Offline Sync', icon: RefreshCw },
  { id: 'devices', label: 'Devices', icon: Cpu },
  { id: 'reports', label: 'Analytics', icon: BarChart3 },
  { id: 'fee-management', label: 'Reports', icon: DollarSign },
  { id: 'firebase-chat', label: 'Firebase Chat', icon: MessageSquare, isChat: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab, alertsCount, onLogout, isMobileOpen, onCloseMobile }) {
  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header matching screenshot */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Bus size={22} style={{ color: 'var(--accent-teal)' }} />
          <span>TRANSIT<span style={{ color: 'var(--accent-teal)' }}>IQ</span></span>
        </div>
        <span className="logo-badge">IoT Core</span>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.hasAlertBadge && alertsCount > 0 && (
                <span className="badge-count">{alertsCount}</span>
              )}
              {item.isChat && (
                <span style={{
                  marginLeft: 'auto',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981'
                }} />
              )}
            </div>
          );
        })}

        {/* Quick Audit Links matching screenshot 4 & 5 */}
        <div style={{ marginTop: '16px', padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Quick Views
          </div>
          <div 
            onClick={() => onSelectTab('boarding-records')} 
            style={{ fontSize: '13px', color: 'var(--accent-teal)', cursor: 'pointer', marginBottom: '6px', opacity: 0.85 }}
          >
            Audit history
          </div>
          <div 
            onClick={() => onSelectTab('drivers')} 
            style={{ fontSize: '13px', color: 'var(--accent-teal)', cursor: 'pointer', marginBottom: '6px', opacity: 0.85 }}
          >
            Driver accounts
          </div>
          <div 
            onClick={() => onSelectTab('routes')} 
            style={{ fontSize: '13px', color: 'var(--accent-teal)', cursor: 'pointer', opacity: 0.85 }}
          >
            Route stops
          </div>
        </div>
      </nav>

      {/* Logout & Footer */}
      <div className="sidebar-footer">
        <button 
          onClick={onLogout}
          className="btn btn-outline" 
          style={{ width: '100%', borderRadius: '10px', fontSize: '13px', justifyContent: 'flex-start' }}
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
