// Import required modules
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

// Define interfaces for position and rotation
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
}

// Define interface for a player
interface Player {
  id: string;
  position: Position;
  rotation: Rotation;
  ws: WebSocket;
}

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Initialize an array to store connected players
let players: Player[] = [];

// Function to broadcast the current state to all connected clients
function broadcastState() {
  const state = { type: "state", data: players };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(state));
    }
  });
  console.log("State broadcasted");
}

// Function to handle creating a new player
function handleCreatePlayer(ws: WebSocket) {
  // Generate a unique ID for the player
  const playerId = uuidv4();
  // Create a new player object with the generated ID, initial position, rotation, and WebSocket connection
  const newPlayer = {
    id: playerId,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    ws: ws,
  };
  // Add the new player to the players array
  players.push(newPlayer);
  // Send the player's ID to the client
  ws.send(JSON.stringify({ type: "id", data: playerId }));
  console.log("Player created:", playerId);
  // Broadcast the current state to all connected clients
  broadcastState();
}

// Function to handle player movement
function handlePlayerMovement(data: any) {
  // Find the player by ID
  const player = players.find((p) => p.id === data.id);
  // If the player is found, update their position and rotation
  if (player) {
    player.position = data.position;
    player.rotation = data.rotation;
    // Broadcast the current state to all connected clients
    broadcastState();
  }
  // Log the player's movement
  console.log("Player moved:", player?.id);
}

// Function to send initial state to a newly connected client
function handleGetInitialState(ws: WebSocket) {
  ws.send(JSON.stringify({ type: "state", data: players }));
  console.log("Initial state sent");
}

// Set up WebSocket server event listeners
wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // Handle incoming messages
  ws.on("message", (message: WebSocket.Data) => {
    const data = JSON.parse(message.toString());
    switch (data.type) {
      case "createPlayer":
        handleCreatePlayer(ws);
        break;
      case "playerMovement":
        handlePlayerMovement(data.data);
        break;
      case "getInitialState":
        handleGetInitialState(ws);
        break;
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    players = players.filter((p) => p.ws !== ws);
    console.log("Player disconnected");
    broadcastState();
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
