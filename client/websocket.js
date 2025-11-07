// Ensure `io` is present 
const socket = (typeof io !== 'undefined') ? io() : null;

function joinRoom(roomId, name, color) {
  socket.emit('join', { roomId, name, color });
}

export { socket, joinRoom };
