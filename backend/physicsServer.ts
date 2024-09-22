// Import required modules
import WebSocket from "ws";
import RAPIER from "@dimforge/rapier3d-compat";

interface ChatMessage {
  playerId: number;
  message: string;
  timestamp: number;
}

// Define interfaces for position and rotation
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Velocity {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Define interface for a player
interface Player {
  id: number;
  position: Position;
  rotation: Rotation;
  velocity: Velocity;
  currentAction: string;
  chatBubble: string;
  ws: WebSocket;
}

interface Enemy {
  id: number;
  position: Position;
  rotation: Rotation;
  velocity: Velocity;
  //hitbox: Hitbox;
  health: number;
  currentAction: string;
}

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
// Initialize an array to store connected players
let players: Player[] = [];
// Initialize a chat log to store chat messages
let chatLog: ChatMessage[] = [];
//Initialize the physics world, 0 gravity
let world: RAPIER.World;
//Define the game loop
let lastState: string = "";

function stateChanged(): boolean {
  const currentState = JSON.stringify(
    players.map((p) => ({
      id: p.id,
      position: p.position,
      rotation: p.rotation,
      velocity: p.velocity,
      chatBubble: p.chatBubble,
      currentAction: p.currentAction,
    }))
  );

  if (currentState !== lastState) {
    lastState = currentState;
    return true;
  } else {
    return false;
  }
}

const gameLoop = (world: RAPIER.World) => {
  // Step the simulation forward.
  world.step();

  if (stateChanged()) {
    publishState();
  }

  setTimeout(() => gameLoop(world), 16);
};

// Function to broadcast the current state to all connected clients
function publishState() {
  const state = { type: "state", payload: players };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(state));
    }
  });
  console.log(
    "STATE PUBLISHED",
    players.map((p) => [
      p.id,
      p.position,
      p.rotation,
      p.velocity,
      p.chatBubble,
      p.currentAction,
    ])
  );
}
// Function to initialize a player
// TODO: On init, generate a rigidbody and add it to the physics world. Also, add a collider to the rigidbody.
function initializePlayer(ws: WebSocket) {
  if (players.length >= 10) {
    ws.send(JSON.stringify({ type: "serverFull", payload: "Server is full" }));
    ws.close();
    return false;
  } else {
    // Create a rigidbody for the player
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0, 0)
      .setRotation({
        x: 0,
        y: 0,
        z: 0,
        w: 0,
      })
      .setLinvel(0, 0, 0);
    // Create a collider for the rigidbody
    const colliderDesc = RAPIER.ColliderDesc.cuboid(5, 5, 5);
    // Add the rigidbody and collider to the physics world
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    const collider = world.createCollider(colliderDesc, rigidBody);

    // Create a new player object
    const newPlayer: Player = {
      id: rigidBody.handle,
      position: rigidBody.translation(),
      rotation: rigidBody.rotation(),
      velocity: rigidBody.linvel(),
      currentAction: "",
      chatBubble: "",
      ws: ws,
    };
    // Add the new player to the players array
    players.push(newPlayer);
    // Send the player's ID to the client
    ws.send(JSON.stringify({ type: "id", payload: newPlayer.id }));
    // Broadcast the current state and chat log to all connected clients
    publishState();
    publishChatLog();

    console.log(
      "NEW PLAYER CONNECTED. CURRENT PLAYERS: ",
      players.map((p) => [
        p.id,
        p.position,
        p.rotation,
        p.velocity,
        p.chatBubble,
        p.currentAction,
      ])
    );
    return true;
  }
}

function publishChatLog() {
  const chatLogMessage = { type: "chatLog", payload: chatLog };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(chatLogMessage));
    }
  });
  console.log("Chat log published, ", chatLog);
}

function handleChatMessage(payload: any) {
  // Add the chat message to the chat log, and publish it to all connected clients
  chatLog.push({
    playerId: payload.playerId,
    message: payload.message,
    timestamp: Date.now(),
  });
  publishChatLog();

  // Also, update the player's chat bubble to display the message
  const player = players.find((p) => p.id === payload.playerId);
  if (player) {
    player.chatBubble = payload.message;
    publishState();
  }
}

function handleAction(payload: any) {
  const player = players.find((p) => p.id === payload.playerId);
  if (player) {
    player.currentAction = payload.action;
    publishState();
    setTimeout(() => {
      player.currentAction = "";
      publishState();
    }, 3000);
  }
}

// Function to handle player movement
// TODO: On movement, update the player's rigidbody depending on the player's inputs.
function handlePlayerMovement(payload: any) {
  // Find the player's rigidbody by ID
  const playerRigidBody = world.getRigidBody(payload.id);
  // Find the player object by ID
  const player = players.find((p) => p.id === payload.id);
  // If the player is found, update their position, velocity, and rotation
  if (player) {
    switch (payload.action) {
      case "w":
        playerRigidBody.setLinvel({ x: 0, y: 0, z: 1 }, true);
        player.velocity = playerRigidBody.linvel();
        player.position = playerRigidBody.translation();
        player.rotation = playerRigidBody.rotation();
        break;
      case "s":
        playerRigidBody.setLinvel({ x: 0, y: 0, z: -1 }, true);
        player.velocity = playerRigidBody.linvel();
        player.position = playerRigidBody.translation();
        player.rotation = playerRigidBody.rotation();
        break;
      case "a":
        playerRigidBody.setLinvel({ x: -1, y: 0, z: 0 }, true);
        player.velocity = playerRigidBody.linvel();
        player.position = playerRigidBody.translation();
        player.rotation = playerRigidBody.rotation();
        break;
      case "d":
        playerRigidBody.setLinvel({ x: 1, y: 0, z: 0 }, true);
        player.velocity = playerRigidBody.linvel();
        player.position = playerRigidBody.translation();
        player.rotation = playerRigidBody.rotation();
        break;
      case "stop":
        playerRigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        player.velocity = playerRigidBody.linvel();
        player.position = playerRigidBody.translation();
        player.rotation = playerRigidBody.rotation();
        break;
    }

    // Broadcast the current state to all connected clients
    publishState();

    // Log the player's movement
    console.log(
      "Player moved:",
      player.id,
      "Physics position:",
      playerRigidBody.translation(),
      "Player position:",
      player.position,
      "Physics rotation:",
      playerRigidBody.rotation(),
      "Player rotation:",
      player.rotation,
      "Physics velocity:",
      playerRigidBody.linvel(),
      "Player velocity:",
      player.velocity
    );
  } else {
    console.log("Player not found:", payload.id);
  }
}

// Set up WebSocket server event listeners
wss.on("connection", (ws: WebSocket) => {
  // Initialize the player
  if (initializePlayer(ws)) {
    console.log("NEW PLAYER CONNECTED");
    // Add event listener to the WebSocket connection for incoming messages
    ws.on("message", (message: WebSocket.Data) => {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case "playerMovement":
          handlePlayerMovement(data.payload);
          break;
        case "chatMessage":
          handleChatMessage(data.payload);
          break;
        case "action":
          handleAction(data.payload);
          break;
      }
    });
    // Handle client disconnection
    ws.on("close", () => {
      const player = players.find((p) => p.ws === ws);
      if (player) {
        const rigidBody = world.getRigidBody(player.id);
        if (rigidBody) {
          world.removeRigidBody(rigidBody);
        }
      }
      players = players.filter((p) => p.ws !== ws);
      console.log("PLAYER DISCONNECTED");
      publishState();
    });
  } else {
    console.log("CONNECTION REJECTED: SERVER IS FULL");
    return;
  }
});

console.log("WEBSOCKET SERVER IS RUNNING ON ws://localhost:8080");

// Initialize RAPIER and begin the game loop
RAPIER.init().then(() => {
  // Create the world after RAPIER has been initialized
  world = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });

  // Start the game loop with the initialized world
  gameLoop(world);
});

//TODO: Shape the colliders to be more accurate to the player's hitbox.
