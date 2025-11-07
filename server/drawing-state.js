// drawing-state.js
// Provides a factory for room drawing state and basic operations (in-memory)

function createRoomState() {
  return {
    users: new Map(),
    operations: [],
    undoStack: [],
    pointers: {},

    pushOperation(op) {
      this.operations.push(op);
      // New operation invalidates redo history
      this.undoStack.length = 0;
    },

    batchPush(ops) {
      ops.forEach(o => this.operations.push(o));
      this.undoStack.length = 0;
    },

    undoLast() {
      const op = this.operations.pop();
      if (op) this.undoStack.push(op);
      return op;
    },

    redoLast() {
      const op = this.undoStack.pop();
      if (op) this.operations.push(op);
      return op;
    },

    clearAll() {
      this.operations.length = 0;
      this.undoStack.length = 0;
    }
  };
}

module.exports = { createRoomState };
