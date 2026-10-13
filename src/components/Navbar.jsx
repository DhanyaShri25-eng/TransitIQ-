import React from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Shield, 
  Cpu, 
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ROLES } from '../types/models';

export default function Navbar({
  pageTitle,
  currentRole,
  onChangeRole,
  theme,
  onToggleTheme,
  onlineDevicesCount,
  totalDevicesCount,
  onOpenSimulator,
  onOpenLanding,
  onToggleMobileMenu
}) {
  const hasLiveDevices = onlineDevicesCount > 0;

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <button 
          onClick={onToggleMobileMenu}
          className="btn btn-outline btn-sm" 
          style={{ display: 'none', padding: '6px' }}
          id="mobile-menu-toggle-btn"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Device Status Badge matching screenshot 4 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          background: hasLiveDevices ? 'rgba(0, 208, 156, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: hasLiveDevices ? 'var(--accent-teal)' : '#EF4444',
          border: `1px solid ${hasLiveDevices ? 'rgba(0, 208, 156, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {hasLiveDevices ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{hasLiveDevices ? `${onlineDevicesCount} LIVE DEVICES` : 'NO LIVE DEVICES'}</span>
        </div>

        {/* Quick Simulator Launcher */}
        <button
          onClick={onOpenSimulator}
          className="btn btn-teal btn-sm"
          style={{ borderRadius: '999px', padding: '6px 14px' }}
          title="Open ESP32 Hardware RFID Tap Simulator"
        >
          <Cpu size={15} />
          <span>Tap Card</span>
        </button>

        {/* Role Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={15} style={{ color: 'var(--text-muted)' }} />
          <select 
            value={currentRole} 
            onChange={(e) => onChangeRole(e.target.value)}
            className="select-filter"
            style={{ padding: '5px 10px', fontSize: '12.5px', borderRadius: '8px' }}
          >
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            <option value={ROLES.TRANSPORT_ADMIN}>Transport Admin</option>
            <option value={ROLES.FEE_ADMIN}>Fee Admin</option>
            <option value={ROLES.READ_ONLY}>Read-Only</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-outline btn-sm"
          style={{ padding: '6px 10px', borderRadius: '8px' }}
          title="Toggle Light / Dark theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* View Public Site */}
        <button
          onClick={onOpenLanding}
          className="btn btn-outline btn-sm"
          style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
        >
          <span>Landing</span>
          <ExternalLink size={13} />
        </button>
      </div>
    </header>
  );
}
