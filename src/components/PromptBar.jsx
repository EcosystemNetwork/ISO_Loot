import React, { useState, useRef } from 'react';

export default function PromptBar({ onSubmit }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = () => {
    const text = value.trim();
    if (text) {
      onSubmit(text);
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.promptBar}>
      <input
        ref={inputRef}
        style={styles.input}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Atlas move to 5,3  |  Nova explore  |  all gather wood"
        autoComplete="off"
      />
      <button style={styles.button} onClick={handleSubmit}>
        Send
      </button>
    </div>
  );
}

const styles = {
  promptBar: {
    display: 'flex',
    padding: '10px 14px',
    background: '#161625',
    borderTop: '1px solid #2a2a40',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '0.95rem',
    border: '1px solid #2a2a40',
    borderRadius: '6px',
    background: '#1e1e32',
    color: '#e0e0e0',
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
