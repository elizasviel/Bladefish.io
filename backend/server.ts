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
function publishState() {
  const state = { type: "state", payload: players };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(state));
    }
  });
  console.log("State published");
}

// Function to initialize a player
function initializePlayer(ws: WebSocket) {
  // Create a new player object with the generated ID, initial position, rotation, and WebSocket connection
  const newPlayer: Player = {
    id: uuidv4(),
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    ws: ws,
  };
  // Add the new player to the players array
  players.push(newPlayer);
  // Send the player's ID to the client
  ws.send(JSON.stringify({ type: "id", payload: newPlayer.id }));
  // Broadcast the current state to all connected clients
  publishState();
}

// Function to handle player movement
function handlePlayerMovement(payload: any) {
  // Find the player by ID
  const player = players.find((p) => p.id === payload.id);
  // If the player is found, update their position and rotation
  if (player) {
    // Apply the delta to the player's existing position
    player.position.x += payload.position.x;
    player.position.y += payload.position.y;
    player.position.z += payload.position.z;

    // Update the player's rotation
    player.rotation = payload.rotation;

    // Broadcast the current state to all connected clients
    publishState();

    // Log the player's movement
    console.log("Player moved:", player.id, "New position:", player.position);
  } else {
    console.log("Player not found:", payload.id);
  }
}

// Set up WebSocket server event listeners
wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // Initialize the player
  initializePlayer(ws);

  // Add event listener to the WebSocket connection for incoming messages
  ws.on("message", (message: WebSocket.Data) => {
    const data = JSON.parse(message.toString());
    switch (data.type) {
      case "playerMovement":
        handlePlayerMovement(data.payload);
        break;
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    players = players.filter((p) => p.ws !== ws);
    console.log("Player disconnected.");
    publishState();
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
