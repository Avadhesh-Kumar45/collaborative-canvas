const { createRoomState } = require('./drawing-state');

const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, createRoomState());
  }
  return rooms.get(roomId);
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
}

module.exports = { getOrCreateRoom, deleteRoom };
