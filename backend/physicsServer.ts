// Import required modules
import WebSocket from "ws";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

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

// Initialize the physics engine
RAPIER.init().then(() => {
  // Create the physics world after RAPIER is initialized
  const world = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });
  // Create a WebSocket server on port 8080
  const wss = new WebSocket.Server({ port: 8080 });
  // Initialize an array to store connected players
  let players: Player[] = [];
  // Initialize a chat log to store chat messages
  let chatLog: ChatMessage[] = [];
  // Initialize a variable to store the last state of the game
  let lastState: string = "";

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
    console.log("WEBSOCKET SERVER IS RUNNING ON ws://localhost:8080");
  });

  function initializePlayer(ws: WebSocket) {
    if (players.length >= 10) {
      ws.send(
        JSON.stringify({ type: "serverFull", payload: "Server is full" })
      );
      ws.close();
      return false;
    } else {
      // Create a rigidbody for the player
      const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
        .setTranslation(0, 0, 0)
        .setRotation({
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        })
        .setLinvel(0, 0, 0);
      const colliderDesc = RAPIER.ColliderDesc.cuboid(5, 5, 5);
      const rigidBody = world.createRigidBody(rigidBodyDesc);
      const collider = world.createCollider(colliderDesc, rigidBody);

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

      publishChatLog();
      publishState();

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

  function publishState() {
    const state = { type: "state", payload: players };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state));
      } else {
        console.log("CLIENT NOT FOUND");
      }
    });
    console.log(
      "STATE PUBLISHED: ",
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

  function publishChatLog() {
    const chatLogMessage = { type: "chatLog", payload: chatLog };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(chatLogMessage));
      } else {
        console.log("CLIENT NOT FOUND");
      }
    });
    console.log("CHAT LOG PUBLISHED: ", chatLog);
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
    } else {
      console.log("PLAYER NOT FOUND");
    }
  }

  function handleAction(payload: any) {
    const player = players.find((p) => p.id === payload.playerId);
    if (player) {
      player.currentAction = payload.action;
      setTimeout(() => {
        player.currentAction = "";
      }, 1500);
    } else {
      console.log("PLAYER NOT FOUND");
    }
  }

  // Function to handle player movement
  // TODO: On movement, update the player's rigidbody depending on the player's inputs.
  function handlePlayerMovement(payload: any) {
    // Find the player by ID
    const player = world.getRigidBody(payload.id);
    const playerObject = players.find((p) => p.id === payload.id);
    const cameraQuarternion = new THREE.Quaternion(
      payload.cameraRotation[0],
      payload.cameraRotation[1],
      payload.cameraRotation[2],
      payload.cameraRotation[3]
    );

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      cameraQuarternion
    );
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuarternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cameraQuarternion);

    let movement = new THREE.Vector3();
    let rotation = new THREE.Quaternion();

    // If the player is found, update their position, velocity, and rotation
    if (player && playerObject) {
      switch (payload.action) {
        case "w":
          movement.add(forward);
          rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
          rotation.setFromRotationMatrix(
            new THREE.Matrix4().lookAt(
              new THREE.Vector3(0, 0, 0),
              forward.negate(),
              up
            )
          );
          movement.normalize().multiplyScalar(10);

          player.setLinvel(
            { x: movement.x, y: movement.y, z: movement.z },
            true
          );
          player.setRotation(
            {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
            true
          );

          playerObject.velocity = player.linvel();
          playerObject.position = player.translation();
          playerObject.rotation = player.rotation();
          break;
        case "s":
          movement.sub(forward);
          rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
          rotation.setFromRotationMatrix(
            new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), forward, up)
          );
          movement.normalize().multiplyScalar(10);

          player.setLinvel(
            { x: movement.x, y: movement.y, z: movement.z },
            true
          );
          player.setRotation(
            {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
            true
          );
          playerObject.velocity = player.linvel();
          playerObject.position = player.translation();
          playerObject.rotation = player.rotation();
          break;

        case "a":
          movement.sub(right);
          rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
          rotation.setFromRotationMatrix(
            new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), right, up)
          );
          movement.normalize().multiplyScalar(10);

          player.setLinvel(
            { x: movement.x, y: movement.y, z: movement.z },
            true
          );
          player.setRotation(
            {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
            true
          );
          playerObject.velocity = player.linvel();
          playerObject.position = player.translation();
          playerObject.rotation = player.rotation();
          break;
        case "d":
          movement.add(right);
          rotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), movement);
          rotation.setFromRotationMatrix(
            new THREE.Matrix4().lookAt(
              new THREE.Vector3(0, 0, 0),
              right.negate(),
              up
            )
          );
          movement.normalize().multiplyScalar(10);

          player.setLinvel(
            { x: movement.x, y: movement.y, z: movement.z },
            true
          );
          player.setRotation(
            {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
            true
          );
          playerObject.velocity = player.linvel();
          playerObject.position = player.translation();
          playerObject.rotation = player.rotation();
          break;
        case "stop":
          player.setLinvel({ x: 0, y: 0, z: 0 }, true);
          playerObject.velocity = player.linvel();
          playerObject.position = player.translation();
          playerObject.rotation = player.rotation();
          break;
      }
    } else {
      console.log("Player not found:", payload.id);
    }
  }

  // Define the game loop
  const gameLoop = () => {
    world.step();
    if (stateChanged()) {
      publishState();
    }
    setTimeout(gameLoop, 16);
  };
  // Start the game loop
  gameLoop();
});
