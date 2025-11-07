const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve client
app.use(express.static(path.join(__dirname, '..', 'client')));

const { getOrCreateRoom } = require('./rooms');

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  let currentRoom = null;
  let user = null;

  socket.on('join', (payload) => {
    const { roomId, name, color } = payload || {};
    currentRoom = roomId || 'default';
    socket.join(currentRoom);
    const room = getOrCreateRoom(currentRoom);
    user = { id: socket.id, name: name || 'Anon', color: color || randomColor() };
    room.users.set(socket.id, user);
    // Send current state to the joining user
    socket.emit('init', {
      users: Array.from(room.users.values()),
      operations: room.operations
    });
    // notify others
    socket.to(currentRoom).emit('user-joined', user);
    io.in(currentRoom).emit('users', Array.from(room.users.values()));
  });

  socket.on('pointer', (p) => {
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    room.pointers[socket.id] = { x: p.x, y: p.y, color: user && user.color };
    socket.to(currentRoom).emit('pointer', { id: socket.id, x: p.x, y: p.y, color: user && user.color });
  });

  // drawing operation (stroke) - append to global history and broadcast
  socket.on('stroke', (op) => {
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    // op should contain {id, userId, path: [{x,y}], color, width}
    room.pushOperation(op);
    socket.to(currentRoom).emit('stroke', op);
  });

  socket.on('batch', (ops) => {
    if (!currentRoom || !Array.isArray(ops)) return;
    const room = getOrCreateRoom(currentRoom);
    room.batchPush(ops);
    socket.to(currentRoom).emit('batch', ops);
  });

  socket.on('undo', () => {
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    const op = room.undoLast();
    if (op) {
      io.in(currentRoom).emit('undo', { opId: op.id });
    }
  });

  socket.on('redo', () => {
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    const op = room.redoLast();
    if (op) io.in(currentRoom).emit('redo', op);
  });

  socket.on('clear', () => {
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    room.clearAll();
    io.in(currentRoom).emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
    if (!currentRoom) return;
    const room = getOrCreateRoom(currentRoom);
    room.users.delete(socket.id);
    delete room.pointers[socket.id];
    socket.to(currentRoom).emit('user-left', socket.id);
    io.in(currentRoom).emit('users', Array.from(room.users.values()));
  });
});

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 80% 50%)`;
}

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
