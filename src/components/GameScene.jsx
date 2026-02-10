import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const TILE_COLORS = {
  grass:  '#2d6a2e',
  water:  '#1a5276',
  stone:  '#6b6b6b',
  sand:   '#c9a94e',
};

const TILE_WIDTH = 1;
const TILE_HEIGHT = 0.1;

function gridToWorld(col, row) {
  return [col * TILE_WIDTH, 0, row * TILE_WIDTH];
}

/* ---- Tile component ---- */
function Tile({ col, row, tileType }) {
  const color = TILE_COLORS[tileType] || TILE_COLORS.grass;
  const [x, y, z] = gridToWorld(col, row);

  return (
    <mesh position={[x, y, z]} receiveShadow>
      <boxGeometry args={[TILE_WIDTH * 0.95, TILE_HEIGHT, TILE_WIDTH * 0.95]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/* ---- TileGrid: renders all map tiles ---- */
function TileGrid({ map }) {
  const tiles = useMemo(() => {
    const result = [];
    for (let row = 0; row < map.length; row++) {
      const cols = map[row];
      if (!cols) continue;
      for (let col = 0; col < cols.length; col++) {
        result.push(
          <Tile key={`${row}-${col}`} col={col} row={row} tileType={cols[col]} />
        );
      }
    }
    return result;
  }, [map]);

  return <>{tiles}</>;
}

/* ---- Agent 3D representation ---- */
function AgentMesh({ agent }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      const [tx, , tz] = gridToWorld(agent.x, agent.y);
      meshRef.current.position.x += (tx - meshRef.current.position.x) * 0.1;
      meshRef.current.position.z += (tz - meshRef.current.position.z) * 0.1;
      meshRef.current.position.y = 0.35 + Math.sin(Date.now() * 0.003) * 0.05;
    }
  });

  const [ix, , iz] = gridToWorld(agent.x, agent.y);

  return (
    <group ref={meshRef} position={[ix, 0.35, iz]}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.15, 0.3, 8, 16]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={0.3} />
      </mesh>

      {/* Head glow */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={agent.color} emissiveIntensity={0.5} />
      </mesh>

      {/* Name label via Html overlay */}
      <Html position={[0, 0.7, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff',
          fontSize: '11px',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          textShadow: '0 0 4px #000, 0 0 2px #000',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {agent.name}
        </div>
      </Html>

      {/* Speech bubble via Html overlay */}
      {agent.lastMessage ? (
        <Html position={[0, 0.95, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            color: '#ffd966',
            fontSize: '10px',
            fontFamily: 'sans-serif',
            textShadow: '0 0 4px #000, 0 0 2px #000',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>
            &ldquo;{agent.lastMessage}&rdquo;
          </div>
        </Html>
      ) : null}

      {/* State indicator ring */}
      {agent.state !== 'idle' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/* ---- Agents group ---- */
function Agents({ agents }) {
  return (
    <>
      {agents.map((agent) => (
        <AgentMesh key={agent.id} agent={agent} />
      ))}
    </>
  );
}

/* ---- Camera setup for isometric view ---- */
function IsometricCamera({ mapWidth, mapHeight }) {
  const { camera } = useThree();

  useEffect(() => {
    const cx = (mapWidth * TILE_WIDTH) / 2;
    const cz = (mapHeight * TILE_WIDTH) / 2;
    const dist = Math.max(mapWidth, mapHeight) * 0.8;

    camera.position.set(cx + dist, dist, cz + dist);
    camera.lookAt(cx, 0, cz);
    camera.updateProjectionMatrix();
  }, [camera, mapWidth, mapHeight]);

  return null;
}

/* ---- Ground plane ---- */
function Ground({ width, height }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(width * TILE_WIDTH) / 2 - 0.5, -0.06, (height * TILE_WIDTH) / 2 - 0.5]}
      receiveShadow
    >
      <planeGeometry args={[width * TILE_WIDTH + 1, height * TILE_WIDTH + 1]} />
      <meshStandardMaterial color="#0a0a18" />
    </mesh>
  );
}

/* ---- Grid lines overlay ---- */
function GridLines({ width, height }) {
  const geometry = useMemo(() => {
    const positions = [];
    for (let i = 0; i <= width; i++) {
      positions.push(i * TILE_WIDTH - 0.475, 0.001, -0.475);
      positions.push(i * TILE_WIDTH - 0.475, 0.001, (height - 1) * TILE_WIDTH + 0.475);
    }
    for (let j = 0; j <= height; j++) {
      positions.push(-0.475, 0.001, j * TILE_WIDTH - 0.475);
      positions.push((width - 1) * TILE_WIDTH + 0.475, 0.001, j * TILE_WIDTH - 0.475);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [width, height]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#1a1a3e" transparent opacity={0.5} />
    </lineSegments>
  );
}

/* ---- Check WebGPU availability ---- */
function useWebGPUAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    async function check() {
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          setAvailable(!!adapter);
        } catch {
          setAvailable(false);
        }
      }
    }
    check();
  }, []);

  return available;
}

/* ---- Main Scene ---- */
export default function GameScene({ map, agents }) {
  const mapHeight = map.length;
  const mapWidth = map[0]?.length || 0;
  const webGPUAvailable = useWebGPUAvailable();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{ fov: 45, near: 0.1, far: 100 }}
      >
        <IsometricCamera mapWidth={mapWidth} mapHeight={mapHeight} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <pointLight position={[6, 5, 6]} intensity={0.5} color="#7ecfff" />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#0f0f1a', 15, 35]} />

        {/* Scene content */}
        <Ground width={mapWidth} height={mapHeight} />
        <GridLines width={mapWidth} height={mapHeight} />
        <TileGrid map={map} />
        <Agents agents={agents} />

        {/* Camera controls */}
        <OrbitControls
          target={[(mapWidth * TILE_WIDTH) / 2, 0, (mapHeight * TILE_WIDTH) / 2]}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={5}
          maxDistance={25}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* WebGPU status indicator */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        fontSize: '0.7rem',
        color: webGPUAvailable ? '#2ecc71' : '#999',
        background: 'rgba(0,0,0,0.5)',
        padding: '2px 8px',
        borderRadius: '4px',
      }}>
        {webGPUAvailable ? '● WebGPU Available' : '● WebGL Renderer'}
      </div>
    </div>
  );
}
