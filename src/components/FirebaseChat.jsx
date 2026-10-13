import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bus, 
  ShieldAlert, 
  Cpu, 
  Radio, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Cloud, 
  Wifi,
  Bot
} from 'lucide-react';
import { firebaseChat, CHAT_CHANNELS } from '../services/firebaseService';

export default function FirebaseChat({ currentRole }) {
  const [activeChannelId, setActiveChannelId] = useState('dispatch-general');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState(
    currentRole === 'Super Admin' ? 'Admin Dispatch (Vikram)' :
    currentRole === 'Transport Administrator' ? 'Transport Coordinator' :
    currentRole === 'Fee Administrator' ? 'Accounts Desk' : 'Transport Observer'
  );

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Subscribe to real-time chat updates (Firebase Firestore / BroadcastChannel)
    const unsubscribe = firebaseChat.subscribe((allMessages) => {
      setMessages([...allMessages]);
    });
    setMessages(firebaseChat.loadStoredMessages());

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const activeChannel = CHAT_CHANNELS.find((c) => c.id === activeChannelId) || CHAT_CHANNELS[0];
  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    await firebaseChat.sendMessage({
      channelId: activeChannelId,
      sender: senderName,
      role: currentRole,
      text: inputText
    });

    setInputText('');
  };

  const handleQuickSend = (text) => {
    firebaseChat.sendMessage({
      channelId: activeChannelId,
      sender: senderName,
      role: currentRole,
      text
    });
  };

  const getChannelIcon = (iconName) => {
    switch (iconName) {
      case 'Bus': return <Bus size={16} />;
      case 'ShieldAlert': return <ShieldAlert size={16} />;
      case 'Cpu': return <Cpu size={16} />;
      default: return <Radio size={16} />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
            Firebase Fleet Dispatch & Transport Chat
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time cloud communication between central transport dispatch, bus drivers, and security supervisors.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            background: 'rgba(0, 208, 156, 0.12)',
            border: '1px solid rgba(0, 208, 156, 0.3)',
            color: 'var(--accent-teal)'
          }}>
            <Cloud size={13} />
            <span>Firebase Cloud Engine: Connected</span>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '20px',
        overflow: 'hidden',
        height: '620px',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Left: Channels Sidebar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRight: '1px solid var(--border-card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '8px' }}>
            Fleet Channels
          </div>

          {CHAT_CHANNELS.map((ch) => {
            const isActive = ch.id === activeChannelId;
            const count = messages.filter(m => m.channelId === ch.id).length;

            return (
              <div
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(0, 208, 156, 0.14)' : 'transparent',
                  color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'rgba(0, 208, 156, 0.25)' : 'transparent'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                {getChannelIcon(ch.icon)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ch.name}
                  </div>
                </div>
                <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '999px', color: '#94A3B8' }}>
                  {count}
                </span>
              </div>
            );
          })}

          {/* User Handle setting */}
          <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Your Handle ({currentRole}):
            </label>
            <input 
              type="text" 
              value={senderName} 
              onChange={(e) => setSenderName(e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Right: Active Chat Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          {/* Channel Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-card)',
            background: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getChannelIcon(activeChannel.icon)}
                <span>#{activeChannel.name}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{activeChannel.description}</div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
              Live Stream Active
            </div>
          </div>

          {/* Message Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {channelMessages.map((msg) => {
              const isMe = msg.sender === senderName;
              const isSystem = msg.role === 'System';

              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '11.5px' }}>
                    <span style={{ fontWeight: 600, color: '#CBD5E1' }}>{msg.sender}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isSystem ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 208, 156, 0.15)',
                      color: isSystem ? '#EF4444' : 'var(--accent-teal)'
                    }}>
                      {msg.role}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 16px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe 
                      ? 'linear-gradient(135deg, #00B688 0%, #00936D 100%)' 
                      : isSystem 
                      ? 'rgba(239, 68, 68, 0.12)' 
                      : '#1A2A3D',
                    color: isMe ? '#042419' : '#FFFFFF',
                    fontWeight: isMe ? 500 : 400,
                    fontSize: '13.5px',
                    lineHeight: 1.5,
                    border: isSystem ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Dispatch Presets */}
          <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.15)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
              Quick Dispatch:
            </span>
            {[
              'Route 1 traffic clear. On schedule.',
              'RFID reader online and accepting taps.',
              'Heavy rush at Metro stop. Extra shuttle needed.',
              'Bus 102 boarding completed at Gate 2.'
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSend(preset)}
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '999px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form onSubmit={handleSendMessage} style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-card)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            gap: '10px'
          }}>
            <input 
              type="text" 
              placeholder={`Message #${activeChannel.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="form-control"
              style={{ borderRadius: '10px' }}
            />
            <button type="submit" className="btn btn-teal" style={{ borderRadius: '10px', padding: '0 20px' }}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
