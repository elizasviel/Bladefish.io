import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

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

interface Player {
  id: string;
  position: Position;
  rotation: Rotation;
  ws: WebSocket;
}

const wss = new WebSocket.Server({ port: 8080 });

let players: Player[] = [];

function broadcastState() {
  const statePlayers = players.map(({ id, position, rotation }) => ({
    id,
    position,
    rotation,
  }));
  const state = { type: "state", data: statePlayers };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(state));
    }
  });
  console.log("State broadcasted", statePlayers);
}

function handleCreatePlayer(ws: WebSocket) {
  const existingPlayer = players.find((p) => p.ws === ws);
  if (existingPlayer) {
    console.log("Player already exists:", existingPlayer.id);
    ws.send(JSON.stringify({ type: "id", data: existingPlayer.id }));
    return;
  }

  const playerId = uuidv4();
  const newPlayer = {
    id: playerId,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    ws: ws,
  };
  players.push(newPlayer);
  ws.send(JSON.stringify({ type: "id", data: playerId }));
  console.log("Player created:", playerId);
  broadcastState();
}

function handlePlayerMovement(data: any) {
  const player = players.find((p) => p.id === data.id);
  if (player) {
    player.position = data.position;
    player.rotation = data.rotation;
    broadcastState();
  }
  console.log("Player moved:", player?.id);
}

function handleGetInitialState(ws: WebSocket) {
  const statePlayers = players.map(({ id, position, rotation }) => ({
    id,
    position,
    rotation,
  }));
  ws.send(JSON.stringify({ type: "state", data: statePlayers }));
  console.log("Initial state sent");
}

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

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

  ws.on("close", () => {
    players = players.filter((p) => p.ws !== ws);
    console.log("Player disconnected");
    broadcastState();
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
