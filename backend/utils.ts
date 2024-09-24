import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "node-three-gltf";
import { BufferGeometry, Mesh, MeshStandardMaterial, Object3D } from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

export function createCollidersFromGLB(glbPath: string, world: RAPIER.World) {
  console.log("Creating colliders from GLB");
  const loader = new GLTFLoader();
  loader.load(glbPath, (gltf) => {
    //console.log("SCENE", gltf.scene);

    const meshes: Mesh[] = [];

    // Traverse the scene to find all meshes
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);

        /*
        console.log(
          "POTENTIALVERTEX",
          child.geometry.attributes.position.array
        );
        console.log("POTENTIALINDEX", child.geometry.index.array);
        */
      }
    });

    // Merge all meshes into a single geometry
    const geometries = meshes.map((mesh) => mesh.geometry);
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    console.log(
      "MERGEDGEOMETRYVERTICES",
      mergedGeometry.attributes.position.array
    );
    console.log("MERGEDGEOMETRYINDICES", mergedGeometry.index?.array);

    const vertices = mergedGeometry.attributes.position.array;
    const indices = mergedGeometry.index?.array;

    if (!indices || !vertices) {
      console.error("MISSING EITHER INDICES OR VERTICES");
      return;
    }

    // Scale up vertices by 10x
    const scaledVertices = new Float32Array(vertices.length);
    for (let i = 0; i < vertices.length; i++) {
      scaledVertices[i] = vertices[i] * 10;
    }

    const colliderDesc = RAPIER.ColliderDesc.trimesh(
      scaledVertices,
      new Uint32Array(indices)
    );
    world.createCollider(colliderDesc);

    //world.createCollider(RAPIER.ColliderDesc.ball(5));
  });
}
