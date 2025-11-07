import CanvasApp, { setTool, setColor, setWidth, doUndo, doRedo, doClear } from './canvas.js';
import { socket, joinRoom } from './websocket.js';

// wire UI
const toolEl = document.getElementById('tool');
const colorEl = document.getElementById('color');
const widthEl = document.getElementById('width');
const undoEl = document.getElementById('undo');
const redoEl = document.getElementById('redo');
const clearEl = document.getElementById('clear');
const joinEl = document.getElementById('join');
const roomEl = document.getElementById('room');
const btnBrush = document.getElementById('btn-brush');
const btnEraser = document.getElementById('btn-eraser');
const saveEl = document.getElementById('save');
const toggleEl = document.getElementById('toggle-side');

toolEl.addEventListener('change', (e)=> setTool(e.target.value));
colorEl.addEventListener('change', (e)=> setColor(e.target.value));
widthEl.addEventListener('input', (e)=> setWidth(Number(e.target.value)));
undoEl.addEventListener('click', ()=> doUndo());
redoEl.addEventListener('click', ()=> doRedo());
clearEl.addEventListener('click', ()=> doClear());
joinEl.addEventListener('click', ()=> {
  const roomId = roomEl.value || 'default';
  const name = 'User-' + Math.floor(Math.random()*1000);
  joinRoom(roomId, name, colorEl.value);
});

// brush/eraser icon shortcuts
if (btnBrush) btnBrush.addEventListener('click', ()=>{
  setTool('brush');
  const t = document.getElementById('tool'); if (t) t.value = 'brush';
  btnBrush.classList.add('active'); btnEraser.classList.remove('active');
});
if (btnEraser) btnEraser.addEventListener('click', ()=>{
  setTool('eraser');
  const t = document.getElementById('tool'); if (t) t.value = 'eraser';
  btnEraser.classList.add('active'); btnBrush.classList.remove('active');
});

// save/export image
if (saveEl) saveEl.addEventListener('click', ()=>{
  if (CanvasApp && CanvasApp.exportImage) CanvasApp.exportImage();
});

// toggle behavior: on small screens the hamburger opens the mobile nav, on larger screens it toggles the side panel
function toggleMobileNav() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  navbar.classList.toggle('nav-open');
}

function toggleSidePanel() {
  const side = document.getElementById('side');
  if (!side) return;
  side.style.display = (side.style.display === 'none') ? 'block' : 'none';
}

if (toggleEl) toggleEl.addEventListener('click', ()=>{
  const isMobile = window.innerWidth <= 480;
  if (isMobile) toggleMobileNav(); else toggleSidePanel();
});

if (socket) {
  socket.on('users', (users)=>{
    const el = document.getElementById('users');
    el.innerHTML = 'Users:<br>' + users.map(u=>`<div style="color:${u.color}">• ${u.name}</div>`).join('');
  });
}

CanvasApp.resize();

// auto-join default room
joinRoom('default', 'Me', colorEl.value);
