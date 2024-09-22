// Import required modules
import WebSocket from "ws";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

// Initialize the physics engine
RAPIER.init().then(() => {
  // Create the physics world after RAPIER is initialized
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  // Create a WebSocket server on port 8080
  const wss = new WebSocket.Server({ port: 8080 });
  // Initialize an array to store connected players
  let players: any[] = [];

  function publishState() {
    const state = { type: "state", payload: players };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state));
      }
    });
  }

  // Set up WebSocket server event listeners
  wss.on("connection", (ws: WebSocket) => {
    // Initialize the player
    if (initializePlayer(ws)) {
      ws.on("message", (message: WebSocket.Data) => {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case "playerMovement":
            handlePlayerMovement(data.payload);
            break;
        }
      });
    }
  });

  function initializePlayer(ws: WebSocket) {
    // Create a rigidbody for the player
    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
      .setTranslation(0, 0, 0)
      .setRotation({
        x: 0,
        y: 0,
        z: 0,
        w: 0,
      })
      .setLinvel(0, 0, 0);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(5, 5, 5);
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    const collider = world.createCollider(colliderDesc, rigidBody);

    const newPlayer = {
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

    publishState();
    return true;
  }

  function handlePlayerMovement(payload: any) {
    // Find the player by ID

    const player = world.getRigidBody(payload.id);
    console.log("LOGGING PLAYER", player);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));

    console.log(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

    player.setRotation(
      {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w,
      },
      true
    );
    console.log("PLAYER ROTATION", player.rotation());
    //publishState();
  }

  // Define the game loop
  const gameLoop = () => {
    world.step();
    setTimeout(gameLoop, 16);
  };
  // Start the game loop
  gameLoop();
});
