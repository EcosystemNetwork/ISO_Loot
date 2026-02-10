import React, { useState, useRef, useCallback, useEffect } from 'react';
import GameScene from './components/GameScene.jsx';
import Sidebar from './components/Sidebar.jsx';
import PromptBar from './components/PromptBar.jsx';
import GameState from './game/GameState.js';
import CommandParser from './agents/CommandParser.js';

export default function App() {
  const stateRef = useRef(null);
  const parserRef = useRef(new CommandParser());
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [map, setMap] = useState([]);
  const [tick, setTick] = useState(0);

  // Initialize game state once
  if (!stateRef.current) {
    const gs = new GameState();
    gs.generateMap(12, 12);
    gs.addAgent('Atlas', 2, 2, '#e74c3c', 'Golem');
    gs.addAgent('Nova',  6, 4, '#3498db', 'Spider');
    gs.addAgent('Echo',  9, 8, '#2ecc71', 'Monkey');
    gs.addMessage('Welcome to ISO Loot! Type a command below.');
    stateRef.current = gs;
  }

  // Game loop
  useEffect(() => {
    const gs = stateRef.current;
    let lastTime = performance.now();
    let frameId;

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      gs.update(dt);

      // Sync React state every ~15 ticks
      if (gs.tick % 15 === 0) {
        setAgents([...gs.getAllAgents()]);
        setMessages([...gs.messages]);
        setTick(gs.tick);
      }
      setMap(gs.map);
      frameId = requestAnimationFrame(loop);
    };

    // Initial sync
    setAgents([...gs.getAllAgents()]);
    setMessages([...gs.messages]);
    setMap(gs.map);

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePrompt = useCallback((text) => {
    const gs = stateRef.current;
    gs.addMessage(`> ${text}`);
    const cmd = parserRef.current.parse(text);

    if (!cmd) {
      gs.addMessage('⚠ Unknown command. Try: AgentName move to X,Y | explore | gather <resource> | build <structure> | say <msg>');
      setMessages([...gs.messages]);
      setAgents([...gs.getAllAgents()]);
      return;
    }

    const targets = cmd.agentName.toLowerCase() === 'all'
      ? gs.getAllAgents()
      : [gs.getAgent(cmd.agentName)].filter(Boolean);

    if (targets.length === 0) {
      gs.addMessage(`⚠ Agent "${cmd.agentName}" not found.`);
      setMessages([...gs.messages]);
      setAgents([...gs.getAllAgents()]);
      return;
    }

    for (const agent of targets) {
      switch (cmd.action) {
        case 'move':
          agent.moveTo(cmd.params.x, cmd.params.y);
          gs.addMessage(`${agent.name} → moving to (${cmd.params.x}, ${cmd.params.y})`);
          break;
        case 'explore':
          agent.explore();
          gs.addMessage(`${agent.name} → exploring`);
          break;
        case 'gather':
          agent.gather(cmd.params.resource);
          gs.addMessage(`${agent.name} → gathering ${cmd.params.resource}`);
          break;
        case 'build':
          agent.build(cmd.params.structure);
          gs.addMessage(`${agent.name} → building ${cmd.params.structure}`);
          break;
        case 'say':
          agent.say(cmd.params.message);
          gs.addMessage(`${agent.name} says: "${cmd.params.message}"`);
          break;
      }
    }
    setMessages([...gs.messages]);
    setAgents([...gs.getAllAgents()]);
  }, []);

  return (
    <>
      <header style={styles.header}>
        <h1 style={styles.title}>🎮 ISO LOOT — AI Agent Playground</h1>
        <span style={styles.badge}>Three.js + WebGPU</span>
      </header>

      <div style={styles.mainArea}>
        <div style={styles.canvasWrap}>
          <GameScene map={map} agents={agents} />
        </div>
        <Sidebar agents={agents} messages={messages} />
      </div>

      <PromptBar onSubmit={handlePrompt} />
    </>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#161625',
    borderBottom: '1px solid #2a2a40',
    gap: '12px',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#7ecfff',
    letterSpacing: '1px',
  },
  badge: {
    fontSize: '0.7rem',
    background: '#2563eb',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
    background: '#0b0b15',
  },
};
