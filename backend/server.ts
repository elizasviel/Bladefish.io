import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Player {
  position: Position;
}

const wss = new WebSocket.Server({ port: 8080 });

const players = new Map<string, Player>();

function broadcastState() {
  const state = {
    type: "state",
    data: Array.from(players.entries()).map(([id, player]) => ({
      id,
      position: player.position,
    })),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(state));
    }
  });
}

function updatePlayerPosition(playerId: string, key: string) {
  const player = players.get(playerId);
  if (!player) return;

  const speed = 0.1;
  switch (key.toLowerCase()) {
    case "w":
    case "arrowup":
    case "keyw":
      player.position.z -= speed;
      break;
    case "s":
    case "arrowdown":
    case "keys":
      player.position.z += speed;
      break;
    case "a":
    case "arrowleft":
    case "keya":
      player.position.x -= speed;
      break;
    case "d":
    case "arrowright":
    case "keyd":
      player.position.x += speed;
      break;
    case " ":
    case "space":
      player.position.y += speed;
      break;
    case "shift":
    case "shiftleft":
      player.position.y -= speed;
      break;
  }
}

wss.on("connection", (ws: WebSocket) => {
  let playerId: string | null = null;

  console.log("New client connected");

  ws.on("message", (message: WebSocket.Data) => {
    const data = JSON.parse(message.toString());

    if (data.type === "createPlayer") {
      playerId = uuidv4();
      players.set(playerId, {
        position: { x: 0, y: 0, z: 0 },
      });
      console.log(`New player created: ${playerId}`);

      // Send the player their ID
      const idMessage = { type: "id", data: playerId };
      ws.send(JSON.stringify(idMessage));

      // Broadcast updated state to all clients
      broadcastState();
    } else if (data.type === "keyEvent" && playerId) {
      updatePlayerPosition(playerId, data.key);
      broadcastState();
    } else if (data.type === "getInitialState") {
      // Send current state to the requesting client
      const currentState = {
        type: "state",
        data: Array.from(players.entries()).map(([id, player]) => ({
          id,
          position: player.position,
        })),
      };
      ws.send(JSON.stringify(currentState));
    }
  });

  ws.on("close", () => {
    if (playerId) {
      console.log(`Player disconnected: ${playerId}`);
      players.delete(playerId);
      broadcastState();
    }
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
