import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CreditCard, 
  Radio, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCode, 
  Copy, 
  Check, 
  Volume2
} from 'lucide-react';
import { verifyRfidEvent, syncOfflineBatch, soundFx } from '../services/rfidEngine';
import { db } from '../services/db';

const ESP32_FIRMWARE_CODE = `/*
 * SmartPassFlow — ESP32 RFID Bus Reader & IoT Controller
 * Hardware: ESP32 DevKit V1, RC522 RFID (SPI), SSD1306 OLED (I2C), MicroSD Module
 * Features: Local offline buffering on SD card, HTTPS authenticated ingestion, Buzzer & LEDs
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>
#include <ArduinoJson.h>

#define SS_PIN    5
#define RST_PIN   22
#define BUZZER    12
#define LED_GREEN 14
#define LED_RED   27
#define SD_CS     13

const char* ssid = "CampusTransport_Fleet";
const char* password = "WiFi_Secure_Password";
const char* serverApiUrl = "https://your-domain.edu/api/rfid/verify";
const char* deviceId = "ESP32-BUS-001";
const char* busId = "BUS-101";
const char* authToken = "auth_tok_esp32_bus101_secure";

MFRC522 rfid(SS_PIN, RST_PIN);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  pinMode(BUZZER, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setCursor(0, 10);
  display.println("SmartPassFlow ESP32");
  display.println("Connecting WiFi...");
  display.display();

  WiFi.begin(ssid, password);
  SD.begin(SD_CS);
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String cardUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    cardUid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    cardUid += String(rfid.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  processCardTap(cardUid);
  rfid.PICC_HaltA();
  delay(1000);
}

void processCardTap(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverApiUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + authToken);

    StaticJsonDocument<256> doc;
    doc["event_id"] = "EVT-" + String(millis());
    doc["device_id"] = deviceId;
    doc["bus_id"] = busId;
    doc["card_uid"] = uid;
    doc["timestamp"] = "2026-10-13T08:15:00Z";

    String payload;
    serializeJson(doc, payload);
    int httpCode = http.POST(payload);

    if (httpCode == 200) {
      String response = http.getString();
      handleVerificationResponse(response);
    } else {
      bufferEventToSD(payload);
    }
    http.end();
  } else {
    // Offline Mode: Buffer event to MicroSD card
    StaticJsonDocument<256> doc;
    doc["event_id"] = "OFF-" + String(millis());
    doc["device_id"] = deviceId;
    doc["bus_id"] = busId;
    doc["card_uid"] = uid;
    String payload;
    serializeJson(doc, payload);
    bufferEventToSD(payload);
  }
}

void bufferEventToSD(String jsonEvent) {
  File file = SD.open("/offline_queue.txt", FILE_APPEND);
  if (file) {
    file.println(jsonEvent);
    file.close();
  }
}

void handleVerificationResponse(String json) {
  StaticJsonDocument<256> res;
  deserializeJson(res, json);
  const char* status = res["verification_status"];

  display.clearDisplay();
  display.setCursor(0, 10);
  if (String(status) == "VALID") {
    digitalWrite(LED_GREEN, HIGH);
    tone(BUZZER, 1200, 150);
    display.println("ACCESS GRANTED");
    display.println(res["student_name"].as<const char*>());
    display.println("Welcome Aboard!");
  } else {
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER, 200, 400);
    display.println("ACCESS DENIED");
    display.println(res["reason"].as<const char*>());
  }
  display.display();
  delay(1500);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
}
`;

export default function HardwareSimulator({ data, onRefresh }) {
  const buses = data.buses || [];
  const devices = data.devices || [];
  const students = data.students || [];

  // Simulator controls
  const [selectedBusId, setSelectedBusId] = useState('BUS-101');
  const [selectedDeviceId, setSelectedDeviceId] = useState('ESP32-BUS-001');
  const [inputCardUid, setInputCardUid] = useState('E2000019');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineBuffer, setOfflineBuffer] = useState([
    { event_id: 'EVT-SD-01', card_uid: 'E2000019', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { event_id: 'EVT-SD-02', card_uid: 'A489C132', timestamp: new Date(Date.now() - 3000000).toISOString() }
  ]);

  // Terminal & OLED state
  const [oledStatus, setOledStatus] = useState('IDLE');
  const [oledMessage, setOledMessage] = useState('READY TO SCAN');
  const [oledSubMessage, setOledSubMessage] = useState('PLEASE TAP SMART CARD');
  const [ledState, setLedState] = useState({ green: false, red: false, blue: true });

  const [lastApiResponse, setLastApiResponse] = useState(null);
  const [lastApiRequest, setLastApiRequest] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'code'

  // Update selected device when bus changes
  useEffect(() => {
    const bus = buses.find((b) => b.bus_id === selectedBusId);
    if (bus && bus.device_id) {
      setSelectedDeviceId(bus.device_id);
    }
  }, [selectedBusId, buses]);

  const handleSimulateTap = (cardUidOverride) => {
    const cardToTap = (cardUidOverride || inputCardUid || '').trim().toUpperCase();
    if (!cardToTap) return;

    // Simulate hardware tap action
    setOledStatus('SCANNING');
    setOledMessage('READING RFID CARD...');
    setOledSubMessage(`UID: 0x${cardToTap}`);

    const eventPayload = {
      event_id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      device_id: selectedDeviceId,
      bus_id: selectedBusId,
      card_uid: cardToTap,
      timestamp: new Date().toISOString(),
      event_type: 'RFID_TAP'
    };
    setLastApiRequest(eventPayload);

    setTimeout(() => {
      if (isOfflineMode) {
        // Queue on virtual MicroSD card
        setOfflineBuffer((prev) => [eventPayload, ...prev]);
        setOledStatus('OFFLINE_SAVED');
        setOledMessage('QUEUED ON MicroSD');
        setOledSubMessage('Wi-Fi offline - buffer safe');
        setLedState({ green: false, red: false, blue: false });
        soundFx.playBeep('DUPLICATE');
        setLastApiResponse({
          success: true,
          offline_buffered: true,
          event_id: eventPayload.event_id,
          message: 'Network offline. Saved to local MicroSD card queue.'
        });
      } else {
        // Online Ingestion Engine
        const res = verifyRfidEvent(eventPayload);
        setLastApiResponse(res);

        if (res.verification_status === 'VALID') {
          setOledStatus('VALID');
          setOledMessage('ACCESS GRANTED');
          setOledSubMessage(`${res.student_name} (${res.student_id})`);
          setLedState({ green: true, red: false, blue: true });
        } else if (res.verification_status === 'DUPLICATE') {
          setOledStatus('DUPLICATE');
          setOledMessage('DUPLICATE TAP');
          setOledSubMessage('Already recorded on this bus');
          setLedState({ green: true, red: false, blue: true });
        } else {
          setOledStatus('REJECTED');
          setOledMessage('ACCESS DENIED');
          setOledSubMessage(res.message || res.reason || 'Verification Failed');
          setLedState({ green: false, red: true, blue: true });
        }
        onRefresh();
      }

      // Return to idle after 3.5 seconds
      setTimeout(() => {
        setOledStatus('IDLE');
        setOledMessage('READY TO SCAN');
        setOledSubMessage('PLEASE TAP SMART CARD');
        setLedState({ green: false, red: false, blue: !isOfflineMode });
      }, 3500);
    }, 400);
  };

  const handleSyncBatch = () => {
    if (offlineBuffer.length === 0) return;

    const syncRes = syncOfflineBatch(selectedDeviceId, selectedBusId, offlineBuffer);
    setOfflineBuffer([]);
    setOledStatus('VALID');
    setOledMessage('SD QUEUE SYNCED');
    setOledSubMessage(`Uploaded ${syncRes.totalReceived} batch scans`);
    setLastApiResponse(syncRes);
    onRefresh();
    soundFx.playBeep('VALID');

    setTimeout(() => {
      setOledStatus('IDLE');
      setOledMessage('READY TO SCAN');
      setOledSubMessage('PLEASE TAP SMART CARD');
    }, 3000);
  };

  const copyFirmware = () => {
    navigator.clipboard.writeText(ESP32_FIRMWARE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            ESP32 Hardware RFID Reader & Terminal
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time emulation of the ESP32 microcontroller, 128x64 OLED display, dual status LEDs, and MicroSD card queue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('simulator')} 
            className={`btn btn-sm ${activeTab === 'simulator' ? 'btn-teal' : 'btn-outline'}`}
          >
            <Radio size={14} /> Interactive Hardware
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={`btn btn-sm ${activeTab === 'code' ? 'btn-teal' : 'btn-outline'}`}
          >
            <FileCode size={14} /> Arduino ESP32 Firmware
          </button>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {/* Left: Physical Hardware Enclosure Simulation */}
          <div style={{
            background: '#070E16',
            border: '2px solid #1E2D3E',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Device Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} style={{ color: 'var(--accent-teal)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: '#FFF' }}>
                  {selectedDeviceId}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#94A3B8' }}>
                  ESP32 v2.4
                </span>
              </div>

              {/* Status LEDs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Blue LED (WiFi) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: ledState.blue ? '#00D0FF' : '#334155',
                    boxShadow: ledState.blue ? '0 0 10px #00D0FF' : 'none'
                  }} />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>WIFI</span>
                </div>

                {/* Green LED (Valid) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: ledState.green ? '#10B981' : '#1E293B',
                    boxShadow: ledState.green ? '0 0 12px #10B981' : 'none'
                  }} />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>OK</span>
                </div>

                {/* Red LED (Error) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: ledState.red ? '#EF4444' : '#1E293B',
                    boxShadow: ledState.red ? '0 0 12px #EF4444' : 'none'
                  }} />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>ERR</span>
                </div>
              </div>
            </div>

            {/* 128x64 OLED Screen Simulation */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                SSD1306 0.96" OLED I2C DISPLAY (128x64)
              </div>
              <div className="oled-screen" style={{
                background: '#010508',
                border: '3px solid #162434',
                borderRadius: '10px',
                padding: '16px',
                minHeight: '130px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: oledStatus === 'VALID' ? '#00FFB2' : oledStatus === 'REJECTED' ? '#FF4D6D' : '#00F0FF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '4px' }}>
                  <span>BUS: {selectedBusId}</span>
                  <span>{isOfflineMode ? '[SD OFFLINE]' : '[CLOUD ONLINE]'}</span>
                </div>

                <div style={{ textAlign: 'center', margin: '14px 0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>
                    {oledMessage}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                    {oledSubMessage}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderTop: '1px solid rgba(0, 240, 255, 0.2)', paddingTop: '4px' }}>
                  <span>RC522 13.56MHz</span>
                  <span>IP: 192.168.10.101</span>
                </div>
              </div>
            </div>

            {/* Bus Selection & Mode Switches */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Target Bus Unit</label>
                <select 
                  className="form-control" 
                  value={selectedBusId} 
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  {buses.map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>{b.bus_number} ({b.bus_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Wi-Fi Connection Mode</label>
                <button 
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                  className={`btn btn-sm ${isOfflineMode ? 'btn-danger' : 'btn-outline'}`}
                  style={{ width: '100%', height: '40px', justifyContent: 'center' }}
                >
                  {isOfflineMode ? <WifiOff size={15} /> : <Wifi size={15} />}
                  <span>{isOfflineMode ? 'Simulate Offline' : 'Wi-Fi Cloud Sync'}</span>
                </button>
              </div>
            </div>

            {/* Manual Card UID Scanner Input */}
            <div>
              <label className="form-label" style={{ fontSize: '12px' }}>Scan RFID Card UID (Hex string)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={inputCardUid} 
                  onChange={(e) => setInputCardUid(e.target.value)}
                  placeholder="e.g. E2000019"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button 
                  onClick={() => handleSimulateTap()} 
                  className="btn btn-teal"
                  style={{ borderRadius: '8px' }}
                >
                  <Send size={15} /> Tap Card
                </button>
              </div>
            </div>

            {/* Offline MicroSD Card Buffer */}
            {isOfflineMode || offlineBuffer.length > 0 ? (
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#F59E0B' }}>
                    <HardDrive size={16} />
                    <span>MicroSD Card Buffer: {offlineBuffer.length} Taps Queued</span>
                  </div>
                  {offlineBuffer.length > 0 && !isOfflineMode && (
                    <button onClick={handleSyncBatch} className="btn btn-teal btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
                      Sync to Cloud
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {isOfflineMode 
                    ? 'Wi-Fi disconnected. MicroSD card is securely buffering taps with exact hardware timestamps.'
                    : 'Reconnected! Click "Sync to Cloud" to batch ingest queued offline scans.'}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: Test Preset Scenarios & Live API Payloads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Test Cards Presets */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>
                1-Click Tap Test Presets
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => handleSimulateTap('E2000019')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                >
                  <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Rahul Sharma</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Valid Pass (Bus 101)</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleSimulateTap('5C778F2A')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <XCircle size={16} style={{ color: '#EF4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Vikram Singh</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Wrong Bus (Bus 102)</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleSimulateTap('91DF03B8')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                >
                  <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Sneha Patel</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expired Pass (2026-06)</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleSimulateTap('7E5521AA')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <XCircle size={16} style={{ color: '#EF4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Arjun Reddy</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fees Unpaid (₹12,000 due)</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleSimulateTap('33AA6790')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <XCircle size={16} style={{ color: '#EF4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Amit Verma</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Blocked Smart Card</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleSimulateTap(`RANDOM-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', borderColor: 'rgba(236, 72, 153, 0.3)' }}
                >
                  <XCircle size={16} style={{ color: '#EC4899' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>Unregistered Card</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unknown Alien RFID</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Live HTTP API Ingestion Request & Response inspector */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
                Hardware REST API Contract & Response
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>POST /api/rfid/verify Payload:</div>
                  <pre style={{ background: '#070C12', padding: '10px', borderRadius: '8px', fontSize: '11.5px', color: '#38BDF8', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                    {JSON.stringify(lastApiRequest || {
                      event_id: 'EVT-0001',
                      device_id: selectedDeviceId,
                      bus_id: selectedBusId,
                      card_uid: 'E2000019',
                      timestamp: '2026-10-13T08:15:00Z',
                      event_type: 'RFID_TAP'
                    }, null, 2)}
                  </pre>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>HTTP 200 JSON Response:</div>
                  <pre style={{ background: '#070C12', padding: '10px', borderRadius: '8px', fontSize: '11.5px', color: lastApiResponse?.success ? '#10B981' : '#EF4444', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                    {JSON.stringify(lastApiResponse || {
                      success: true,
                      event_id: 'EVT-0001',
                      verification_status: 'READY',
                      message: 'Awaiting RFID tap'
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Arduino Firmware Sketch Viewer */
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>ESP32 Physical Firmware (smartpassflow_esp32.ino)</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Production-ready C++ firmware supporting SPI RC522 reader, I2C SSD1306 OLED, MicroSD logging, and HTTPS backend ingestion.
              </p>
            </div>
            <button onClick={copyFirmware} className="btn btn-teal btn-sm">
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied!' : 'Copy Arduino Sketch'}</span>
            </button>
          </div>

          <pre style={{
            background: '#070C12',
            padding: '20px',
            borderRadius: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#E2E8F0',
            overflowX: 'auto',
            maxHeight: '500px',
            border: '1px solid var(--border-subtle)'
          }}>
            {ESP32_FIRMWARE_CODE}
          </pre>
        </div>
      )}
    </div>
  );
}
