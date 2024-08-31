const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Set();

wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "position") {
      // Broadcast the position to all other clients
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "players",
              players: [{ id: ws.id, position: data.data }],
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  // Assign a unique ID to the client
  ws.id = Math.random().toString(36).substr(2, 9);
});

console.log("WebSocket server is running on ws://localhost:8080");
