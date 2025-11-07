# 🎨 Collaborative Canvas

Draw together in real-time! A fun, lightweight drawing app where multiple people can create art simultaneously using just their web browser.

##  What We Can Do

- Draw with brush and eraser tools
- Pick any color and adjust brush size
- See other people drawing in real-time
- Undo/redo your strokes
- Create or join drawing rooms
- Save your artwork as PNG
- Works on desktop and mobile devices

##  Quick Start

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or newer)
2. Open your terminal and run:
   ```bash
   npm install
   npm start
   ```
3. Open http://localhost:3000 in your browser
4. Share the URL with friends and start drawing together!

 **Pro tip:** Open the app in multiple browser windows to test the collaboration features by yourself.

##  Perfect For

- Remote whiteboarding sessions
- Teaching and explanations
- Quick sketches with friends
- Creative collaboration
- Fun doodling together!

##  Technical Overview

Built with modern web technologies:
- Pure JavaScript (no frameworks)
- HTML5 Canvas for smooth drawing
- Socket.IO for real-time communication
- Node.js backend for instant syncing

Project structure:
```
collaborative-canvas/
├── client/              # Browser-side code
│   ├── index.html      # Main HTML page with canvas and controls
│   ├── style.css       # Responsive styles and visual theming
│   ├── canvas.js       # Drawing engine (strokes, undo/redo)
│   ├── main.js         # UI event handlers and app initialization
│   └── websocket.js    # Real-time sync with Socket.IO
├── server/             # Backend server code
│   ├── server.js       # Express + Socket.IO server setup
│   ├── rooms.js        # Room management and user tracking
│   └── drawing-state.js # Stroke history and operation handling
├── ARCHITECTURE.md     # Detailed technical documentation
├── README.md          # Project overview 
└── package.json       # Dependencies and run scripts
```

Each component's role:

###  Client-side
- `index.html`: Defines the UI layout with canvas, toolbar, and room controls
- `style.css`: Handles responsive design, animations, and glassmorphism effects
- `canvas.js`: Core drawing engine that manages the canvas, strokes, and cursors
- `main.js`: Connects UI events to canvas actions and handles room joining
- `websocket.js`: Manages real-time communication with the server

###  Server-side
- `server.js`: Sets up HTTP and WebSocket servers, routes client connections
- `rooms.js`: Manages drawing rooms, user sessions, and real-time updates
- `drawing-state.js`: Stores and processes drawing operations (add/undo/redo)

###  Documentation & Config
- `ARCHITECTURE.md`: In-depth technical details and data flow explanations
- `README.md`: Project overview and getting started guide
- `package.json`: Project metadata and npm dependencies

## 🤝 Contributing

Found a bug? Have an idea? Contributions are welcome! Here's how:
1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

##  Current Limitations

- Undo/redo affects all users in the room (global history)
- Room data is stored in memory (clears when server restarts)
- Basic user handling (no accounts or permissions)
