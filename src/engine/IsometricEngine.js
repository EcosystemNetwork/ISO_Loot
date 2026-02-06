const CHROMA_GREEN_MIN = 80;
const CHROMA_DOMINANCE = 1.3;
const SPRITE_DRAW_SIZE = 48;

const TILE_COLORS = {
  grass:  { fill: '#2d6a2e', stroke: '#1f4f20' },
  water:  { fill: '#1a5276', stroke: '#154360' },
  stone:  { fill: '#6b6b6b', stroke: '#505050' },
  sand:   { fill: '#c9a94e', stroke: '#a68a3e' },
};

export default class IsometricEngine {
  constructor(canvas, tileWidth = 64, tileHeight = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.cameraX = 0;
    this.cameraY = 0;
    this.map = [];
    this.agents = [];

    // sprite video elements keyed by sprite type name
    this._sprites = {};
    // off-screen canvas for chroma key processing
    this._chromaCanvas = null;
    this._chromaCtx = null;
  }

  /* ---- sprite loading ---- */

  loadSprite(type, videoSrc) {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {}); // ignore autoplay restrictions
    this._sprites[type] = video;
  }

  /* ---- coordinate helpers ---- */

  cartToIso(cx, cy) {
    return {
      x: (cx - cy) * (this.tileWidth / 2) + this.cameraX,
      y: (cx + cy) * (this.tileHeight / 2) + this.cameraY,
    };
  }

  isoToCart(sx, sy) {
    const adjX = sx - this.cameraX;
    const adjY = sy - this.cameraY;
    return {
      x: Math.floor((adjX / (this.tileWidth / 2) + adjY / (this.tileHeight / 2)) / 2),
      y: Math.floor((adjY / (this.tileHeight / 2) - adjX / (this.tileWidth / 2)) / 2),
    };
  }

  /* ---- rendering ---- */

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  setMap(map) { this.map = map; }

  setAgents(agents) { this.agents = agents; }

  render() {
    this.resizeCanvas();
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // centre the grid
    this.cameraX = canvas.width / 2;
    this.cameraY = 80;

    this._drawGrid();
    this._drawAgents();
  }

  _drawGrid() {
    const { ctx, map } = this;
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < (map[row]?.length ?? 0); col++) {
        const tileType = map[row][col] || 'grass';
        const colors = TILE_COLORS[tileType] || TILE_COLORS.grass;
        const { x, y } = this.cartToIso(col, row);
        this._drawTile(ctx, x, y, colors);
      }
    }
  }

  _drawTile(ctx, x, y, colors) {
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();

    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawAgents() {
    const { ctx } = this;
    for (const agent of this.agents) {
      const { x, y } = this.cartToIso(agent.x, agent.y);

      const video = this._sprites[agent.spriteType];
      if (video && video.readyState >= 2) {
        this._drawChromaKeyFrame(video, x, y);
      } else {
        // fallback diamond body while video loads
        const s = 10;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();
        ctx.fillStyle = agent.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // name label
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(agent.name, x, y - 30);

      // speech bubble
      if (agent.lastMessage) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#ffd966';
        ctx.fillText(`"${agent.lastMessage}"`, x, y - 42);
      }
    }
  }

  _drawChromaKeyFrame(video, x, y) {
    if (!this._chromaCanvas) {
      this._chromaCanvas = document.createElement('canvas');
      this._chromaCtx = this._chromaCanvas.getContext('2d', { willReadFrequently: true });
    }
    const cc = this._chromaCanvas;
    const cctx = this._chromaCtx;

    const vw = video.videoWidth || 64;
    const vh = video.videoHeight || 64;

    // size the offscreen canvas to the video dimensions
    if (cc.width !== vw || cc.height !== vh) {
      cc.width = vw;
      cc.height = vh;
    }

    cctx.drawImage(video, 0, 0, vw, vh);

    const imageData = cctx.getImageData(0, 0, vw, vh);
    const data = imageData.data;

    // chroma key: remove green-screen pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (g > CHROMA_GREEN_MIN && g > r * CHROMA_DOMINANCE && g > b * CHROMA_DOMINANCE) {
        data[i + 3] = 0; // transparent
      }
    }

    cctx.putImageData(imageData, 0, 0);

    // draw the processed frame centred on the agent position
    const drawSize = SPRITE_DRAW_SIZE;
    const aspect = vw / vh;
    const drawW = drawSize * aspect;
    const drawH = drawSize;
    this.ctx.drawImage(cc, x - drawW / 2, y - drawH, drawW, drawH);
  }
}
