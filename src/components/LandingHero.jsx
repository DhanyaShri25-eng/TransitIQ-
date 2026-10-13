import React from 'react';
import { 
  ShieldCheck, 
  WifiOff, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Bus, 
  Cpu, 
  CreditCard, 
  Users, 
  ChevronRight,
  Layers
} from 'lucide-react';

export default function LandingHero({ onEnterDashboard, onOpenSimulator }) {
  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8, 14, 21, 0.85)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(0, 208, 156, 0.15)',
            border: '1px solid rgba(0, 208, 156, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-teal)'
          }}>
            <Bus size={20} />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.5px'
          }}>
            TRANSIT<span style={{ color: 'var(--accent-teal)' }}>IQ</span>
          </span>
          <span style={{
            fontSize: '11px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 8px',
            borderRadius: '999px',
            color: 'var(--text-muted)'
          }}>
            SmartPassFlow v2.4
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => {
              const el = document.getElementById('how-it-works-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-outline" 
            style={{ borderRadius: '999px', padding: '7px 18px', fontSize: '13px' }}
          >
            How it works
          </button>
          <button 
            onClick={onOpenSimulator}
            className="btn btn-outline" 
            style={{ borderRadius: '999px', padding: '7px 18px', fontSize: '13px', borderColor: 'rgba(0, 208, 156, 0.4)', color: 'var(--accent-teal)' }}
          >
            <Cpu size={15} /> Hardware Simulator
          </button>
          <button 
            onClick={onEnterDashboard}
            className="btn btn-teal" 
            style={{ borderRadius: '999px', padding: '8px 22px', fontSize: '13.5px' }}
          >
            Launch Transport Workspace <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero Section matching Screenshot 1 */}
      <div style={{ padding: '36px 40px 60px', maxWidth: '1320px', margin: '0 auto' }}>
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          minHeight: '520px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}>
          {/* Background Hero Image */}
          <img 
            src="/campus_bus_hero.jpg" 
            alt="Smart College Bus Campus" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0
            }}
          />
          {/* Gradient Overlay for high-contrast typography */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(8, 14, 21, 0.95) 0%, rgba(8, 14, 21, 0.82) 48%, rgba(8, 14, 21, 0.4) 100%)'
          }} />

          {/* Hero Content */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '54px 50px',
            maxWidth: '680px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(0, 208, 156, 0.12)',
              border: '1px solid rgba(0, 208, 156, 0.3)',
              color: 'var(--accent-teal)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              width: 'fit-content'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
              SMART COLLEGE TRANSPORT
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              color: '#FFFFFF'
            }}>
              One tap.<br />
              <span style={{ color: '#FFFFFF' }}>A verified journey.</span>
            </h1>

            <p style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: '#CBD5E1',
              maxWidth: '540px'
            }}>
              RFID bus-pass verification, live transport oversight and traceable scan records — built specifically for college transport teams and ESP32 IoT hardware.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
              <button 
                onClick={onEnterDashboard}
                className="btn btn-teal" 
                style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '12px' }}
              >
                Access Dashboard
              </button>
              <button 
                onClick={onOpenSimulator}
                className="btn btn-outline" 
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                Test RFID Tap
              </button>
            </div>

            {/* Badges row matching Screenshot 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D', fontSize: '13px', fontWeight: 600 }}>
                <ShieldCheck size={18} />
                <span>RFID verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D', fontSize: '13px', fontWeight: 600 }}>
                <WifiOff size={18} />
                <span>Works offline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D', fontSize: '13px', fontWeight: 600 }}>
                <Activity size={18} />
                <span>Realtime monitoring</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Value Proposition Cards matching Screenshot 2 */}
        <div style={{ marginTop: '70px' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '28px',
            letterSpacing: '-0.5px'
          }}>
            Built for every campus journey
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Card 1 */}
            <div style={{
              background: '#0F1A25',
              border: '1px solid #1A2B3D',
              borderRadius: '20px',
              padding: '32px 28px',
              transition: 'transform 0.2s, border-color 0.2s',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 208, 156, 0.12)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '12px'
              }}>
                Verify before boarding
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14.5px', lineHeight: 1.6 }}>
                Check registered RFID, current pass and assigned bus. Repeated taps never increase verification totals or inflate passenger counts.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{
              background: '#0F1A25',
              border: '1px solid #1A2B3D',
              borderRadius: '20px',
              padding: '32px 28px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '12px'
              }}>
                Monitor with context
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14.5px', lineHeight: 1.6 }}>
                Review wrong-bus alerts, scanner heartbeats and pending scan uploads from a single unified transport operations workspace.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{
              background: '#0F1A25',
              border: '1px solid #1A2B3D',
              borderRadius: '20px',
              padding: '32px 28px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 208, 156, 0.12)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '12px'
              }}>
                Keep an audit trail
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14.5px', lineHeight: 1.6 }}>
                Filter scan history and export CSV reports. RFID-Verified Passengers is not exact occupancy and is never treated as academic attendance.
              </p>
            </div>
          </div>
        </div>

        {/* How it works Section matching Screenshot 3 */}
        <div id="how-it-works-section" style={{ marginTop: '80px', paddingTop: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            background: '#0C1520',
            border: '1px solid #18283A',
            borderRadius: '24px',
            padding: '36px',
            overflow: 'hidden'
          }}>
            {/* Left image of student tapping RFID */}
            <div style={{ borderRadius: '18px', overflow: 'hidden', height: '420px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <img 
                src="/student_rfid_tap.jpg" 
                alt="Student tapping RFID card at bus door scanner" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Right steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#F59E0B',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  HOW IT WORKS
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginTop: '6px',
                  letterSpacing: '-0.5px'
                }}>
                  From a tap to a trusted trip.
                </h2>
              </div>

              {/* Step 1 */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent-teal)',
                  minWidth: '32px'
                }}>
                  01
                </span>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Tap card
                  </h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
                    Present your registered RFID card at the bus reader.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent-teal)',
                  minWidth: '32px'
                }}>
                  02
                </span>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Verify pass and bus
                  </h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
                    Check current pass validity, fee status and assigned bus before boarding.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent-teal)',
                  minWidth: '32px'
                }}>
                  03
                </span>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                    Live dashboard
                  </h4>
                  <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>
                    Follow verification activity, live occupancy and transport alerts in one place.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '13px',
                color: '#64748B'
              }}>
                New driver accounts require an administrator to assign a bus before transport records become visible.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '70px',
          paddingTop: '28px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#64748B',
          fontSize: '13px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>TRANSITIQ · Smart college transport verification and IoT pass management</div>
          <div>All rights reserved · ESP32 + Cloud Backend Ready</div>
        </footer>
      </div>
    </div>
  );
}
