// Import required modules
import WebSocket from "ws";
import * as RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

//A ChatMessage always has a playerId, message, and timestamp
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
  movingTowards: Position;
  targetPositions: Position[];
  health: number;
  currentAction: string;
  aggression: number;
}

// Initialize the physics engine
RAPIER.init().then(() => {
  // Create the physics world after RAPIER is initialized
  const world = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });
  // Create a queue for handling collision events
  const eventQueue = new RAPIER.EventQueue(true);

  // Create a WebSocket server on port 8080
  const wss = new WebSocket.Server({ port: 8080 });

  // Create a WebSocket server on port 8081 for chat messages
  const chatServer = new WebSocket.Server({ port: 8081 });
  // Initialize a variable to store the last state of the game
  let lastState: { players: Player[]; enemies: Enemy[] } = {
    players: [],
    enemies: [],
  };

  // Initialize an array to store connected players
  let players: Player[] = [];
  // Initialize an array to store enemies
  let enemies: Enemy[] = [];
  // Initialize a chat log to store chat messages
  let chatLog: ChatMessage[] = [];

  // Set up chat server event listeners
  chatServer.on("connection", (ws: WebSocket) => {
    ws.on("open", () => {
      console.log("CHAT SERVER CONNECTION OPENED");
    });
    ws.on("message", (message: WebSocket.Data) => {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case "chatMessage":
          handleChatMessage(data.payload);
          break;
      }
    });
    ws.on("close", () => {
      console.log("CHAT SERVER CONNECTION CLOSED");
    });
  });

  // Set up game server event listeners
  wss.on("connection", (ws: WebSocket) => {
    // Initialize the player
    initializePlayer(
      new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic),
      RAPIER.ColliderDesc.cuboid(1, 1, 2),
      {
        id: 0,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        chatBubble: "",
        currentAction: "",
        ws: ws,
      },
      ws
    );

    // Add event listener to the WebSocket connection for incoming messages
    ws.on("message", (message: WebSocket.Data) => {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case "playerMovement":
          handlePlayerMovement(data.payload);
          break;
        case "action":
          handleAction(data.payload);
          break;
      }
    });
    // Handle client disconnection
    ws.on("close", () => {
      const player = players.find((p) => p.ws === ws);
      // Remove the player from the physics world
      if (player) {
        const rigidBody = world.getRigidBody(player.id);
        if (rigidBody) {
          world.removeRigidBody(rigidBody);
        }
      }
      // Remove the player from the players array
      players = players.filter((p) => p.ws !== ws);
      console.log("PLAYER DISCONNECTED");
    });
  });

  //Spawnenemy needs to be able to take in a spawn position, a collider description, and a target position
  function spawnEnemy(
    rigidBodyDesc: RAPIER.RigidBodyDesc,
    colliderDesc: RAPIER.ColliderDesc,
    enemy: Enemy
  ) {
    // Add the rigidbody to the world
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    // Add the collider to the world
    const collider = world.createCollider(colliderDesc, rigidBody);
    // Set the enemy's id to the rigidbody's handle
    enemy.id = rigidBody.handle;
    // Add the enemy to the enemies array
    enemies.push(enemy);
    console.log("ENEMY SPAWNED");
  }

  function initializePlayer(
    rigidBodyDesc: RAPIER.RigidBodyDesc,
    colliderDesc: RAPIER.ColliderDesc,
    player: Player,
    ws: WebSocket
  ) {
    // Create a rigidbody for the player
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    // Create a collider for the player
    const collider = world.createCollider(colliderDesc, rigidBody);
    // Set the player's id to the rigidbody's handle
    player.id = rigidBody.handle;
    // Add the player to the players array
    players.push(player);
    ws.send(JSON.stringify({ type: "id", payload: player.id }));
    console.log("PLAYER INITIALIZED");
  }

  function publishState() {
    const state = {
      type: "state",
      payload: { players: players, enemies: enemies },
    };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state));
      } else {
        console.log("CLIENT NOT FOUND");
      }
    });
    //console.log("STATE PUBLISHED: ", state);
  }

  function publishChatLog() {
    const chatLogMessage = { type: "chatLog", payload: chatLog };
    chatServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(chatLogMessage));
      } else {
        console.log("CHAT CLIENT NOT FOUND");
      }
    });
    // console.log("CHAT LOG PUBLISHED: ", chatLog);
  }

  function handleChatMessage(payload: any) {
    // Add the chat message to the chat log, and publish it to all connected clients
    chatLog.push({
      playerId: payload.playerId,
      message: payload.message,
      timestamp: Date.now(),
    });

    // Also, update the player's chat bubble to display the message
    const player = players.find((p) => p.id === payload.playerId);
    if (player) {
      player.chatBubble = payload.message;
    } else {
      console.log("PLAYER NOT FOUND");
    }
    publishChatLog();
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

          break;
        case "stop":
          player.setLinvel({ x: 0, y: 0, z: 0 }, true);

          break;
      }
    } else {
      console.log("Player not found:", payload.id);
    }
    //console.log("PLAYER MOVED");
  }

  // Define the game loop
  const gameLoop = () => {
    world.step(eventQueue);

    eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      console.log("COLLISION EVENT: ", handle1, handle2, started);

      //On collision, check if either of the handles is a player
      //And check if either of the handles is an enemy

      const player =
        players.find((p) => p.id === handle1) ||
        players.find((p) => p.id === handle2);

      const enemy =
        enemies.find((e) => e.id === handle1) ||
        enemies.find((e) => e.id === handle2);

      //If we have a player, an enemy, and the collision has started
      if (player && enemy && started) {
        console.log("Player hit enemy");
        enemy.health -= 10;
        console.log("Enemy health:", enemy.health);
        if (enemy.health <= 0) {
          world.removeRigidBody(world.getRigidBody(enemy.id));
          enemies = enemies.filter((e) => e.id !== enemy.id);
        }
      }
    });

    //Update the player positions
    players.forEach((player) => {
      const rigidBody = world.getRigidBody(player.id);
      if (rigidBody) {
        player.position = rigidBody.translation();
        player.rotation = rigidBody.rotation();
        player.velocity = rigidBody.linvel();
      }
    });

    //Update the enemy positions
    enemies.forEach((enemy) => {
      const rigidBody = world.getRigidBody(enemy.id);
      if (rigidBody) {
        const currentPos = new THREE.Vector3(
          enemy.position.x,
          enemy.position.y,
          enemy.position.z
        );

        // Check if the enemy is close to its target
        const distanceThreshold = 0.5; // Adjust this value as needed
        const distanceToTarget = currentPos.distanceTo(
          new THREE.Vector3(
            enemy.movingTowards.x,
            enemy.movingTowards.y,
            enemy.movingTowards.z
          )
        );

        if (distanceToTarget < distanceThreshold) {
          // Switch to the other target
          enemy.movingTowards =
            enemy.movingTowards === enemy.targetPositions[0]
              ? enemy.targetPositions[1]
              : enemy.targetPositions[0];
        }

        const targetPos = new THREE.Vector3(
          enemy.movingTowards.x,
          enemy.movingTowards.y,
          enemy.movingTowards.z
        );

        const direction = new THREE.Vector3()
          .subVectors(targetPos, currentPos)
          .normalize();

        // Calculate rotation to face the destination
        const targetRotation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          direction
        );

        // Set rotation
        rigidBody.setRotation(
          {
            x: targetRotation.x,
            y: targetRotation.y,
            z: targetRotation.z,
            w: targetRotation.w,
          },
          true
        );

        // Set linear velocity towards the destination
        const speed = 5; // Adjust this value to change enemy speed
        const velocity = direction.multiplyScalar(speed);
        rigidBody.setLinvel(
          {
            x: velocity.x,
            y: velocity.y,
            z: velocity.z,
          },
          true
        );

        // Update enemy object properties
        enemy.position = rigidBody.translation();
        enemy.rotation = rigidBody.rotation();
        enemy.velocity = rigidBody.linvel();
      }
    });

    // Check for state changes
    const newState = {
      players: players.map((p) => ({ ...p, ws: undefined })), // Exclude WebSocket from comparison
      enemies: enemies,
    };

    if (JSON.stringify(newState) !== JSON.stringify(lastState)) {
      publishState();
      lastState = JSON.parse(JSON.stringify(newState)); // Deep copy the new state
    }

    // Send the debug meshes to the client
    const { vertices, colors } = world.debugRender();
    const debugMeshes = {
      type: "debugMeshes",
      payload: { vertices, colors },
    };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(debugMeshes));
      }
    });

    setTimeout(gameLoop, 16);
  };
  // Start the game loop
  gameLoop();
  setTimeout(() => {
    spawnEnemy(
      new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.KinematicVelocityBased),
      RAPIER.ColliderDesc.cuboid(1, 1, 2)
        .setSensor(true)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      {
        id: 0, //This number is replaced with handle when spawned
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        movingTowards: { x: 0, y: 0, z: 0 },
        targetPositions: [
          { x: 20, y: 0, z: 0 },
          { x: -20, y: 0, z: 0 },
        ],
        health: 50,
        currentAction: "",
        aggression: 0,
      }
    );
  }, 10000);
});
