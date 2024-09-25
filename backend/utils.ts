import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "node-three-gltf";
import { BufferGeometry, Mesh, SkinnedMesh, Object3D, Matrix4 } from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

export function createCollidersFromGLB(
  glbPath: string,
  world: RAPIER.World,
  rigidBody: RAPIER.RigidBody
) {
  console.log("Creating colliders from GLB");
  const loader = new GLTFLoader();
  loader.load(glbPath, (gltf) => {
    const meshes: Mesh[] = [];

    // Recursive function to process all nodes
    function processNode(node: Object3D) {
      if (node instanceof Mesh || node instanceof SkinnedMesh) {
        meshes.push(node);
      }
      node.children.forEach(processNode);
    }

    // Start processing from the scene root
    processNode(gltf.scene);

    // Merge all meshes into a single geometry
    const geometries = meshes.map((mesh) => {
      const geometry = mesh.geometry.clone();
      const worldMatrix = new Matrix4();
      mesh.updateWorldMatrix(true, false);
      worldMatrix.multiplyMatrices(mesh.matrixWorld, mesh.matrix);
      geometry.applyMatrix4(worldMatrix);
      return geometry;
    });
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    const vertices = mergedGeometry.attributes.position.array;
    const indices = mergedGeometry.index?.array;

    if (!indices || !vertices) {
      console.error("MISSING EITHER INDICES OR VERTICES");
      return;
    }

    // Create the collider using the transformed vertices
    const colliderDesc = RAPIER.ColliderDesc.trimesh(
      new Float32Array(vertices),
      new Uint32Array(indices)
    );
    // Attach the collider to the provided rigid body
    world.createCollider(colliderDesc, rigidBody);

    console.log("Collider created successfully");
  });
}
