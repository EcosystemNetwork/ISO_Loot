import React, { useRef, useEffect } from 'react';

export default function Sidebar({ agents, messages }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <aside style={styles.sidebar}>
      <h2 style={styles.sectionTitle}>Agents</h2>
      <div style={styles.agentStatus}>
        {agents.map((a) => (
          <div key={a.id} style={styles.agentCard}>
            <div style={{ ...styles.name, color: a.color }}>{a.name}</div>
            <div style={styles.detail}>{a.getStatus()}</div>
            <div style={styles.detail}>
              Inventory: {a.inventory.length ? a.inventory.join(', ') : 'empty'}
            </div>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionTitle}>Log</h2>
      <div ref={logRef} style={styles.messageLog}>
        {messages.map((m, i) => (
          <div key={i} style={styles.msg}>{m.text}</div>
        ))}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 260,
    background: '#161625',
    borderLeft: '1px solid #2a2a40',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#7ecfff',
    padding: '12px 14px 6px',
  },
  agentStatus: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 14px',
    fontSize: '0.82rem',
    lineHeight: 1.6,
  },
  agentCard: {
    background: '#1e1e32',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '8px',
  },
  name: {
    fontWeight: 700,
    marginBottom: '2px',
  },
  detail: {
    color: '#999',
    fontSize: '0.78rem',
  },
  messageLog: {
    height: 130,
    overflowY: 'auto',
    padding: '8px 14px',
    fontSize: '0.78rem',
    color: '#aaa',
    borderTop: '1px solid #2a2a40',
  },
  msg: {
    padding: '2px 0',
    borderBottom: '1px solid #1a1a2e',
  },
};
