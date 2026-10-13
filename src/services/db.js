/**
 * In-Memory & LocalStorage Persistent Database for SmartPassFlow (TransitIQ)
 * STRICT DATASET MATCHING USER'S SCREENSHOTS & REAL HARDWARE SETUP:
 * - Real Device: ESP32-WROOM-32 + RFID-RC522 connected to Bus 54
 * - 2 Students: DHANYA SHRI.A.C (Unpaid) & KAVIYAN.V (Paid)
 * - 2 Buses: 54 (Assigned ESP32-WROOM-32) & 67
 * - 2 Routes: Periyar Nagar & Mettur
 */

const STORAGE_KEY = 'transitiq_db_v4_hardware';

export const INITIAL_DATA = {
  students: [
    {
      student_id: '732224AI020',
      full_name: 'DHANYA SHRI.A.C',
      department: 'B.Tech AI&DS',
      year_of_study: '3rd Year',
      section: 'A',
      phone: '+91 99448 47680',
      parent_name: 'CHINNASAMY.A',
      parent_relation: 'Father',
      parent_mobile: '9944847680',
      stop_name: 'Periyaar Nagar',
      tag: '',
      email: 'dhanyashri@campus.edu',
      rfid_card_uid: 'E2000019',
      assigned_bus: '54',
      assigned_route: 'Periyar Nagar',
      bus_pass_status: 'Active',
      fee_payment_status: 'Unpaid',
      pass_start_date: '2026-08-01',
      pass_expiry_date: '2027-05-31',
      account_status: 'Active'
    },
    {
      student_id: '732224AI054',
      full_name: 'KAVIYAN.V',
      department: 'B.Tech AI&DS',
      year_of_study: '3rd Year',
      section: 'B',
      phone: '+91 70106 15946',
      parent_name: 'Vijay.R',
      parent_relation: 'Father',
      parent_mobile: '7010615946',
      stop_name: 'Mettur',
      tag: 'BUS67-COMMON',
      email: 'kaviyan.v@campus.edu',
      rfid_card_uid: 'A489C132',
      assigned_bus: '67',
      assigned_route: 'Mettur',
      bus_pass_status: 'Active',
      fee_payment_status: 'Paid',
      pass_start_date: '2026-08-01',
      pass_expiry_date: '2027-05-31',
      account_status: 'Active'
    }
  ],

  buses: [
    {
      bus_id: '54',
      bus_number: '54',
      registration_number: '54 · 1001 · Active',
      capacity: 62,
      assigned_route: 'Periyar Nagar',
      assigned_driver: 'DRV-001',
      driver_name: 'Ramesh Kumar',
      device_id: 'ESP32-WROOM-32',
      current_boarding_count: 0,
      bus_status: 'Active',
      last_device_communication: new Date().toISOString()
    },
    {
      bus_id: '67',
      bus_number: '67',
      registration_number: '67 · 1002 · Active',
      capacity: 62,
      assigned_route: 'Mettur',
      assigned_driver: 'DRV-002',
      driver_name: 'Carlos Fernandes',
      device_id: '',
      current_boarding_count: 0,
      bus_status: 'Active',
      last_device_communication: null
    }
  ],

  routes: [
    {
      route_id: 'RT-54',
      route_name: 'Periyar Nagar',
      route_number: '54',
      service: 'Morning & Evening',
      starting_point: 'Periyaar Nagar Junction',
      destination: 'Campus Innovation Hub',
      stops: ['Periyaar Nagar', 'Anna Nagar', 'Campus Main Gate'],
      assigned_bus: '54',
      assigned_driver: 'DRV-001',
      students_count: 0,
      route_status: 'Active'
    },
    {
      route_id: 'RT-67',
      route_name: 'Mettur',
      route_number: '67',
      service: '',
      starting_point: 'Mettur Dam Bus Stand',
      destination: 'Campus Innovation Hub',
      stops: ['Mettur', 'RS Road', 'Campus Gate 2'],
      assigned_bus: '67',
      assigned_driver: 'DRV-002',
      students_count: 1,
      route_status: 'Active'
    }
  ],

  drivers: [
    {
      driver_id: 'DRV-001',
      full_name: 'Ramesh Kumar',
      phone: '+91 99001 23456',
      license_number: 'TN27-20150009812',
      assigned_bus: '54',
      assigned_route: 'Periyar Nagar',
      employment_status: 'Active'
    },
    {
      driver_id: 'DRV-002',
      full_name: 'Carlos Fernandes',
      phone: '+91 99001 23457',
      license_number: 'TN27-20180004533',
      assigned_bus: '67',
      assigned_route: 'Mettur',
      employment_status: 'Active'
    }
  ],

  rfid_cards: [
    { card_uid: 'E2000019', student_id: '732224AI020', card_status: 'Active', registered_at: '2026-08-01T09:00:00Z', last_tap_at: null },
    { card_uid: 'A489C132', student_id: '732224AI054', card_status: 'Active', registered_at: '2026-08-01T09:30:00Z', last_tap_at: null }
  ],

  bus_passes: [
    { pass_id: 'PASS-5401', student_id: '732224AI020', rfid_card_uid: 'E2000019', assigned_bus: '54', assigned_route: 'Periyar Nagar', start_date: '2026-08-01', expiry_date: '2027-05-31', total_fee: 18000, amount_paid: 0, outstanding_balance: 18000, payment_status: 'Unpaid', pass_status: 'Active' },
    { pass_id: 'PASS-6701', student_id: '732224AI054', rfid_card_uid: 'A489C132', assigned_bus: '67', assigned_route: 'Mettur', start_date: '2026-08-01', expiry_date: '2027-05-31', total_fee: 22000, amount_paid: 22000, outstanding_balance: 0, payment_status: 'Paid', pass_status: 'Active' }
  ],

  payments: [
    { payment_id: 'PAY-7701', student_id: '732224AI054', pass_id: 'PASS-6701', amount: 22000, payment_date: '2026-08-01', payment_method: 'UPI', transaction_reference: 'UPI/260801/1054', verification_status: 'Verified' }
  ],

  // Real Hardware Device from User's Photograph: ESP32-WROOM-32 DevKit + RFID-RC522
  devices: [
    {
      device_id: 'ESP32-WROOM-32',
      device_name: 'ESP32-WROOM-32 + RC522',
      device_label: 'ESP32-DEV-RC522',
      firmware_version: 'v2.4.2-ota',
      assigned_bus: '54',
      device_status: 'Online',
      last_seen: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      last_successful_sync: new Date().toISOString(),
      pending_event_count: 0,
      credential_reference: 'auth_tok_esp32_bus54_live',
      hardware_image: '/esp32_hardware_setup.jpg',
      hardware_chip: 'ESP32-WROOM-32 (30-pin)',
      rfid_reader: 'MFRC522 (13.56MHz SPI)',
      wifi_ssid: 'CampusTransport_Fleet',
      wifi_rssi: -54,
      ip_address: '192.168.10.54',
      pinout: {
        sda: 'GPIO 5',
        sck: 'GPIO 18',
        mosi: 'GPIO 23',
        miso: 'GPIO 19',
        rst: 'GPIO 22',
        gnd: 'GND',
        vcc: '3V3'
      }
    }
  ],

  boarding_records: [],
  security_alerts: [],

  settings: {
    duplicate_tap_window_minutes: 5,
    allow_unpaid_boarding: false,
    capacity_warning_threshold_pct: 85,
    device_heartbeat_timeout_seconds: 120,
    academic_year: '2026-2027',
    college_name: 'TransitIQ Smart Transport Campus',
    firebase_config: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      connected: false
    }
  }
};

class DatabaseService {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load DB from localStorage, falling back to seed:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.data));
  }

  getSnapshot() {
    return this.data;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData();
  }

  // --- Student operations ---
  addStudent(student) {
    if (this.data.students.some((s) => s.student_id.toLowerCase() === student.student_id.toLowerCase())) {
      throw new Error(`Student ID "${student.student_id}" already exists.`);
    }
    this.data.students.unshift(student);

    if (student.rfid_card_uid) {
      const existingCard = this.data.rfid_cards.find((c) => c.card_uid === student.rfid_card_uid);
      if (existingCard) {
        existingCard.student_id = student.student_id;
        existingCard.card_status = 'Active';
      } else {
        this.data.rfid_cards.unshift({
          card_uid: student.rfid_card_uid,
          student_id: student.student_id,
          card_status: 'Active',
          registered_at: new Date().toISOString(),
          last_tap_at: null
        });
      }
    }

    const newPass = {
      pass_id: `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      student_id: student.student_id,
      rfid_card_uid: student.rfid_card_uid || '',
      assigned_bus: student.assigned_bus,
      assigned_route: student.assigned_route,
      start_date: student.pass_start_date || '2026-08-01',
      expiry_date: student.pass_expiry_date || '2027-05-31',
      total_fee: 18000,
      amount_paid: student.fee_payment_status === 'Paid' ? 18000 : 0,
      outstanding_balance: student.fee_payment_status === 'Paid' ? 0 : 18000,
      payment_status: student.fee_payment_status || 'Unpaid',
      pass_status: student.bus_pass_status || 'Active'
    };
    this.data.bus_passes.unshift(newPass);

    this.saveData();
    return student;
  }

  updateStudent(studentId, updates) {
    const idx = this.data.students.findIndex((s) => s.student_id === studentId);
    if (idx === -1) throw new Error('Student not found');
    this.data.students[idx] = { ...this.data.students[idx], ...updates };

    const pass = this.data.bus_passes.find((p) => p.student_id === studentId);
    if (pass) {
      if (updates.assigned_bus) pass.assigned_bus = updates.assigned_bus;
      if (updates.assigned_route) pass.assigned_route = updates.assigned_route;
      if (updates.bus_pass_status) pass.pass_status = updates.bus_pass_status;
      if (updates.fee_payment_status) {
        pass.payment_status = updates.fee_payment_status;
        if (updates.fee_payment_status === 'Paid') {
          pass.amount_paid = pass.total_fee;
          pass.outstanding_balance = 0;
        }
      }
      if (updates.rfid_card_uid) pass.rfid_card_uid = updates.rfid_card_uid;
    }

    this.saveData();
    return this.data.students[idx];
  }

  deleteStudent(studentId) {
    this.data.students = this.data.students.filter((s) => s.student_id !== studentId);
    const card = this.data.rfid_cards.find((c) => c.student_id === studentId);
    if (card) {
      card.student_id = null;
      card.card_status = 'Inactive';
    }
    this.saveData();
  }

  // --- RFID Cards ---
  registerCard(card) {
    const existing = this.data.rfid_cards.find((c) => c.card_uid === card.card_uid);
    if (existing) {
      throw new Error(`RFID Card UID "${card.card_uid}" is already registered.`);
    }
    this.data.rfid_cards.unshift({
      card_uid: card.card_uid,
      student_id: card.student_id || null,
      card_status: card.card_status || 'Active',
      registered_at: new Date().toISOString(),
      last_tap_at: null
    });
    if (card.student_id) {
      const student = this.data.students.find((s) => s.student_id === card.student_id);
      if (student) student.rfid_card_uid = card.card_uid;
    }
    this.saveData();
  }

  updateCardStatus(cardUid, newStatus) {
    const card = this.data.rfid_cards.find((c) => c.card_uid === cardUid);
    if (!card) throw new Error('Card not found');
    card.card_status = newStatus;
    this.saveData();
  }

  replaceCard(oldCardUid, newCardUid, studentId) {
    const oldCard = this.data.rfid_cards.find((c) => c.card_uid === oldCardUid);
    if (oldCard) {
      oldCard.card_status = 'Replaced';
      oldCard.student_id = null;
    }

    this.data.rfid_cards.unshift({
      card_uid: newCardUid,
      student_id: studentId,
      card_status: 'Active',
      registered_at: new Date().toISOString(),
      last_tap_at: null
    });

    const student = this.data.students.find((s) => s.student_id === studentId);
    if (student) student.rfid_card_uid = newCardUid;

    const pass = this.data.bus_passes.find((p) => p.student_id === studentId);
    if (pass) pass.rfid_card_uid = newCardUid;

    this.saveData();
  }

  // --- Bus operations ---
  addBus(bus) {
    if (this.data.buses.some((b) => b.bus_id === bus.bus_id)) {
      throw new Error(`Bus ID "${bus.bus_id}" already exists.`);
    }
    this.data.buses.unshift(bus);
    this.saveData();
  }

  updateBus(busId, updates) {
    const idx = this.data.buses.findIndex((b) => b.bus_id === busId);
    if (idx === -1) throw new Error('Bus not found');
    this.data.buses[idx] = { ...this.data.buses[idx], ...updates };
    this.saveData();
    return this.data.buses[idx];
  }

  deleteBus(busId) {
    this.data.buses = this.data.buses.filter((b) => b.bus_id !== busId);
    this.saveData();
  }

  // --- Route operations ---
  addRoute(route) {
    this.data.routes.unshift(route);
    this.saveData();
  }

  updateRoute(routeId, updates) {
    const idx = this.data.routes.findIndex((r) => r.route_id === routeId);
    if (idx === -1) throw new Error('Route not found');
    this.data.routes[idx] = { ...this.data.routes[idx], ...updates };
    this.saveData();
  }

  deleteRoute(routeId) {
    this.data.routes = this.data.routes.filter((r) => r.route_id !== routeId);
    this.saveData();
  }

  // --- Driver operations ---
  addDriver(driver) {
    this.data.drivers.unshift(driver);
    this.saveData();
  }

  updateDriver(driverId, updates) {
    const idx = this.data.drivers.findIndex((d) => d.driver_id === driverId);
    if (idx === -1) throw new Error('Driver not found');
    this.data.drivers[idx] = { ...this.data.drivers[idx], ...updates };
    this.saveData();
  }

  // --- Payments ---
  recordPayment(payment) {
    const newPayment = {
      payment_id: `PAY-${Math.floor(8000 + Math.random() * 2000)}`,
      student_id: payment.student_id,
      pass_id: payment.pass_id,
      amount: Number(payment.amount),
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'UPI',
      transaction_reference: payment.transaction_reference,
      verification_status: 'Verified'
    };

    this.data.payments.unshift(newPayment);

    const pass = this.data.bus_passes.find((p) => p.pass_id === payment.pass_id || p.student_id === payment.student_id);
    if (pass) {
      pass.amount_paid = Number(pass.amount_paid || 0) + Number(payment.amount);
      pass.outstanding_balance = Math.max(0, pass.total_fee - pass.amount_paid);
      if (pass.outstanding_balance === 0) {
        pass.payment_status = 'Paid';
      } else {
        pass.payment_status = 'Partially Paid';
      }
    }

    const student = this.data.students.find((s) => s.student_id === payment.student_id);
    if (student && pass) {
      student.fee_payment_status = pass.payment_status;
    }

    this.saveData();
    return newPayment;
  }

  // --- Devices ---
  registerDevice(device) {
    this.data.devices.unshift(device);
    this.saveData();
  }

  updateDevice(deviceId, updates) {
    const dev = this.data.devices.find((d) => d.device_id === deviceId);
    if (!dev) throw new Error('Device not found');
    Object.assign(dev, updates);
    this.saveData();
  }

  deleteDevice(deviceId) {
    this.data.devices = this.data.devices.filter((d) => d.device_id !== deviceId);
    this.saveData();
  }

  recordHeartbeat(deviceId) {
    const dev = this.data.devices.find((d) => d.device_id === deviceId);
    if (dev) {
      dev.last_seen = new Date().toISOString();
      dev.last_heartbeat = new Date().toISOString();
      dev.device_status = 'Online';
      this.saveData();
    }
  }

  // --- Security Alerts ---
  resolveAlert(alertId) {
    const alert = this.data.security_alerts.find((a) => a.alert_id === alertId);
    if (alert) {
      alert.resolution_status = 'Resolved';
      alert.resolved_at = new Date().toISOString();
      this.saveData();
    }
  }

  addAlert(alert) {
    this.data.security_alerts.unshift({
      alert_id: `ALT-${Math.floor(3000 + Math.random() * 7000)}`,
      created_at: new Date().toISOString(),
      resolution_status: 'Pending',
      resolved_at: null,
      ...alert
    });
    this.saveData();
  }

  // --- Settings ---
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
  }
}

export const db = new DatabaseService();
