import { socket } from './websocket.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let currentPath = [];
let tool = 'brush';
let color = '#000000';
let width = 4;

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  // set internal pixel size for high-DPI
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  // reset transform then scale according to ratio
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(ratio, ratio);
  redrawAll();
}

window.addEventListener('resize', resize);

// local op history mirror to manage undo/redo locally
const ops = []; // {id, userId, path, color, width, tool}

function drawPath(op, ctxInstance) {
  const c = ctxInstance || ctx;
  c.save();
  if (op.tool === 'eraser') {
    c.globalCompositeOperation = 'destination-out';
    c.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = op.color;
  }
  c.lineWidth = op.width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const path = op.path;
  if (!path || path.length === 0) { c.restore(); return; }
  c.beginPath();
  c.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.restore();
}

function redrawAll() {
  // full clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw ops
  ops.forEach(op => drawPath(op));
}

function startDraw(x,y) {
  drawing = true;
  // store coordinates relative to canvas top-left (CSS pixels)
  currentPath = [{x: Math.round(x), y: Math.round(y)}];
  // broadcast that this user started drawing (show drawing indicator to others)
  if (socket) {
    socket.emit('pointer', { x, y, isDrawing: true });
  }
}

function continueDraw(x,y) {
  if (!drawing) return;
  currentPath.push({x,y});
  // include drawing state so others can see we're drawing
  if (socket) socket.emit('pointer', { x, y, isDrawing: true });
  // draw incremental line to reduce latency
  const lastTwo = currentPath.slice(-2);
  if (lastTwo.length === 2) {
    ctx.save();
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'; else ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = (tool === 'eraser') ? 'rgba(0,0,0,1)' : color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastTwo[0].x, lastTwo[0].y);
    ctx.lineTo(lastTwo[1].x, lastTwo[1].y);
    ctx.stroke();
    ctx.restore();
  }
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  const op = { id: generateId(), userId: socket.id, path: currentPath.slice(), color, width, tool };
  ops.push(op);
  socket.emit('stroke', op);
  currentPath = [];
  // broadcast that this user stopped drawing (hide drawing indicator)
  if (socket) {
    socket.emit('pointer', { x: null, y: null, isDrawing: false });
  }
}

// Mouse events
// Use pointer events with capture to avoid losing events when pointer moves fast
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  startDraw(x, y);
});
canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  // pointer broadcast (if socket ready)
  if (socket) socket.emit('pointer', { x, y });
  continueDraw(x,y);
});
canvas.addEventListener('pointerup', (e) => { canvas.releasePointerCapture(e.pointerId); endDraw(); });
canvas.addEventListener('pointercancel', (e) => { canvas.releasePointerCapture(e.pointerId); endDraw(); });
canvas.addEventListener('pointerleave', (e) => endDraw());

// socket handlers for incoming strokes
socket.on('stroke', (op) => {
  ops.push(op);
  drawPath(op);
});
socket.on('batch', (incoming) => {
  incoming.forEach(op => { ops.push(op); drawPath(op); });
});
socket.on('undo', ({ opId }) => {
  // remove last op with that id
  const idx = ops.findIndex(o=>o.id===opId);
  if (idx>=0) { ops.splice(idx,1); redrawAll(); }
});
socket.on('redo', (op) => { ops.push(op); drawPath(op); });
socket.on('clear', () => { ops.length = 0; redrawAll(); });

// init state
socket.on('init', (s) => {
  if (Array.isArray(s.operations)) {
    s.operations.forEach(op=>{ ops.push(op); });
    redrawAll();
  }
  if (Array.isArray(s.users)) updateUsers(s.users);
});

// cursors: use CSS for styling; JS only manages classes and left/top
const cursorContainer = document.createElement('div');
cursorContainer.className = 'cursor-container';
document.body.appendChild(cursorContainer);

const remoteCursors = {}; // id -> element
socket.on('pointer', (p) => {
  const { id, x, y, color, isDrawing } = p;
  let el = remoteCursors[id];
  if (!el) {
    el = document.createElement('div');
    el.className = 'cursor idle';
    // color is user-specific; keep that inline since it varies per user
    el.style.background = color || '#f00';
    cursorContainer.appendChild(el);
    remoteCursors[id] = el;
  }
  // if coordinates are null/undefined the user is not currently over canvas
  const rect = canvas.getBoundingClientRect();
  if (typeof x === 'number' && typeof y === 'number') {
    const left = Math.round(rect.left + x);
    const top = Math.round(rect.top + y);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.display = 'block';
  } else {
    // hide when no coordinates
    el.style.display = 'none';
  }
  // toggle drawing state class
  if (isDrawing) {
    el.classList.add('drawing');
    el.classList.remove('idle');
  } else {
    el.classList.remove('drawing');
    el.classList.add('idle');
  }
});

socket.on('user-left', (id) => {
  if (remoteCursors[id]) {
    remoteCursors[id].remove();
    delete remoteCursors[id];
  }
});

// helpers
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function updateUsers(users) {
  const el = document.getElementById('users');
  el.innerHTML = 'Users:<br>' + users.map(u=>`<div style="color:${u.color}">• ${u.name}</div>`).join('');
}

export function setTool(t) { tool = t; }
export function setColor(c) { color = c; }
export function setWidth(w) { width = w; }
export function doUndo() { socket.emit('undo'); }
export function doRedo() { socket.emit('redo'); }
export function doClear() { socket.emit('clear'); }

export function exportImage(filename = 'canvas.png') {
  try {
    // Use the displayed CSS size for the exported image
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.warn('Failed to export image', err);
  }
}

// expose a simple API for main.js
export default {
  setTool, setColor, setWidth, doUndo, doRedo, doClear, exportImage, resize
};
