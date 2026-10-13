import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { ROLES } from './types/models';

import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import DashboardOverview from './components/DashboardOverview';
import StudentManagement from './components/StudentManagement';
import RfidManagement from './components/RfidManagement';
import BusManagement from './components/BusManagement';
import RouteManagement from './components/RouteManagement';
import DriverManagement from './components/DriverManagement';
import BusPasses from './components/BusPasses';
import FeeManagement from './components/FeeManagement';
import BoardingRecords from './components/BoardingRecords';
import SecurityAlerts from './components/SecurityAlerts';
import OfflineSync from './components/OfflineSync';
import IoTDevices from './components/IoTDevices';
import ReportsAnalytics from './components/ReportsAnalytics';
import FirebaseChat from './components/FirebaseChat';
import SettingsView from './components/SettingsView';
import HardwareSimulator from './components/HardwareSimulator';

export default function App() {
  const [data, setData] = useState(() => db.getSnapshot());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('dashboard'); // 'landing' | 'dashboard'
  const [currentRole, setCurrentRole] = useState(ROLES.SUPER_ADMIN);
  const [theme, setTheme] = useState('dark');
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscribe to database changes
  useEffect(() => {
    const unsub = db.subscribe((freshData) => {
      setData({ ...freshData });
    });
    return () => unsub();
  }, []);

  // Sync theme class to body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const handleRefresh = () => {
    setData({ ...db.getSnapshot() });
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    setViewMode('landing');
  };

  // Device status calculations
  const onlineDevices = (data.devices || []).filter((d) => d.device_status === 'Online').length;
  const totalDevices = (data.devices || []).length;
  const activeAlerts = (data.security_alerts || []).filter((a) => a.resolution_status !== 'Resolved').length;

  const getPageTitle = () => {
    const item = NAV_ITEMS.find((n) => n.id === activeTab);
    if (activeTab === 'dashboard') return 'Transport Overview';
    return item?.label || 'College Transport Management';
  };

  // Render Public Landing View (Screenshots 1, 2, 3)
  if (viewMode === 'landing') {
    return (
      <LandingHero 
        onEnterDashboard={() => setViewMode('dashboard')}
        onOpenSimulator={() => {
          setViewMode('dashboard');
          setIsSimulatorModalOpen(true);
        }}
      />
    );
  }

  // Render Full Application Dashboard
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        alertsCount={activeAlerts}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Navbar */}
        <Navbar 
          pageTitle={getPageTitle()}
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onlineDevicesCount={onlineDevices}
          totalDevicesCount={totalDevices}
          onOpenSimulator={() => setIsSimulatorModalOpen(true)}
          onOpenLanding={() => setViewMode('landing')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content Pane */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              data={data}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSimulator={() => setIsSimulatorModalOpen(true)}
            />
          )}

          {activeTab === 'live-monitoring' && (
            <HardwareSimulator 
              data={data}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'rfid-cards' && (
            <RfidManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'buses' && (
            <BusManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
              onOpenSimulator={() => setIsSimulatorModalOpen(true)}
            />
          )}

          {activeTab === 'routes' && (
            <RouteManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'drivers' && (
            <DriverManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'bus-passes' && (
            <BusPasses 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'fee-management' && (
            <FeeManagement 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'boarding-records' && (
            <BoardingRecords 
              data={data}
            />
          )}

          {activeTab === 'security-alerts' && (
            <SecurityAlerts 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}

          {activeTab === 'offline-sync' && (
            <OfflineSync 
              data={data}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'devices' && (
            <IoTDevices 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
              onOpenSimulator={() => setIsSimulatorModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalytics 
              data={data}
            />
          )}

          {activeTab === 'firebase-chat' && (
            <FirebaseChat 
              currentRole={currentRole}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              data={data}
              onRefresh={handleRefresh}
              role={currentRole}
            />
          )}
        </main>
      </div>

      {/* Global Quick Hardware Tap Simulator Modal */}
      {isSimulatorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSimulatorModalOpen(false)}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '980px', width: '95%' }}
          >
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                Interactive ESP32 RFID Hardware Console
              </h3>
              <button 
                onClick={() => setIsSimulatorModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <HardwareSimulator 
                data={data}
                onRefresh={handleRefresh}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsSimulatorModalOpen(false)} className="btn btn-outline">
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
