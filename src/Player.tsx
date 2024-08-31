import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Shape } from "three";
import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import {
  useKeyboardControls,
  PerspectiveCamera,
  OrbitControls,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import * as THREE from "three";

const SPEED = 5;
const JUMP_FORCE = 3;

//W always moves the player towards the direction the camera is facing
//S always moves the player away from the direction the camera is facing
//The camera follows the player

export function Player() {
  const playerRef = useRef<RapierRigidBody>(null);
  const cameraRef = useRef(null);
  const [playerRotation] = useState(new THREE.Quaternion());

  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const { forward, backward, left, right, space } = getKeys();
    //Velocity tells us how fast the player is moving
    const velocity = playerRef.current.linvel() as THREE.Vector3;
    //Movement tells us in which direction the player is moving
    const movement = calculateMovement(camera, forward, backward, left, right);
    //Calculates the new velocity based on the movement, current velocity, and if the player is jumping
    const newVelocity = calculateNewVelocity(movement, velocity, space);
    //Sets the player's linear velocity to the new velocity
    playerRef.current.setLinvel(newVelocity, true);
    //Updates the player's rotation based on the movement vector

    if (movement.length() > 0) {
      updatePlayerRotation(movement, playerRotation, delta);
      playerRef.current.setRotation(playerRotation, true);
    }

    updateCameraPosition(playerRef.current, cameraRef.current);
  });

  return (
    <>
      <PerspectiveCamera fov={75} />
      <OrbitControls
        ref={cameraRef}
        minDistance={7}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0.3}
      />
      <PlayerMesh ref={playerRef} />
    </>
  );
}

//Calculates the movement vector based on the camera's direction and the WASD keys
//W, or forward, always moves the player towards the direction the camera is facing
//S, or backward, always moves the player away from the direction the camera is facing
function calculateMovement(
  camera: THREE.Camera,
  forward: boolean,
  backward: boolean,
  left: boolean,
  right: boolean
) {
  const cameraDirection = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .setY(0)
    .normalize();
  const cameraRight = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(camera.quaternion)
    .setY(0)
    .normalize();

  const movement = new THREE.Vector3();
  if (forward) movement.add(cameraDirection);
  if (backward) movement.sub(cameraDirection);
  if (left) movement.sub(cameraRight);
  if (right) movement.add(cameraRight);

  return movement.normalize();
}

function calculateNewVelocity(
  movement: THREE.Vector3,
  currentVelocity: THREE.Vector3,
  jump: boolean
) {
  return {
    x: movement.x * SPEED,
    y: jump ? JUMP_FORCE : currentVelocity.y,
    z: movement.z * SPEED,
  };
}

//Updates the player's rotation based on the movement vector
function updatePlayerRotation(
  movement: THREE.Vector3,
  currentRotation: THREE.Quaternion,
  delta: number
) {
  const targetRotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    movement
  );
  targetRotation.x = 0;
  targetRotation.z = 0;
  targetRotation.slerp(currentRotation, 50 * delta);
  currentRotation.copy(targetRotation);
}

//Updates the camera's position based on the player's position
function updateCameraPosition(player: RapierRigidBody, camera: any) {
  if (camera) {
    const position = player.translation();
    camera.target.set(position.x, position.y, position.z);
    camera.update();
  }
}

const PlayerMesh = React.forwardRef<RapierRigidBody>((_, ref) => {
  const { scene, animations } = useGLTF(
    "/Animated Fish Bundle-glb/Fish.glb"
  ) as any;
  const { actions } = useAnimations(animations, scene);

  React.useEffect(() => {
    // Assuming the swimming animation is named "Swim"
    // If it has a different name, replace "Swim" with the correct animation name
    const swim = actions["Armature|Swim.001"];
    if (swim) {
      swim.play();
    }
  }, [actions]);

  return (
    <RigidBody
      colliders="hull"
      restitution={0}
      ccd={true}
      ref={ref}
      lockRotations={true}
      name="player"
    >
      <group scale={[0.5, 0.5, 0.5]}>
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
});

PlayerMesh.displayName = "PlayerMesh";

useGLTF.preload("/Animated Fish Bundle-glb/Fish.glb");
