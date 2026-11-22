import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;

const MATERIALS = {
  head: new THREE.MeshStandardMaterial({ color: 0xe6c896, roughness: 0.6, metalness: 0.05 }),
  torso: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.55, metalness: 0.1 }),
  lowerTorso: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6, metalness: 0.1 }),
  arm: new THREE.MeshStandardMaterial({ color: 0xe6c896, roughness: 0.6, metalness: 0.05 }),
  forearm: new THREE.MeshStandardMaterial({ color: 0xd9b882, roughness: 0.6, metalness: 0.05 }),
  leg: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.08 }),
  foot: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 }),
  jointDot: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
};

const EDGE_MATERIAL = new THREE.LineBasicMaterial({
  color: 0x0f172a,
  transparent: true,
  opacity: 0.35,
});

function createBoxPart(w, h, d, material, offset = [0, 0, 0]) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(offset[0], offset[1], offset[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), EDGE_MATERIAL);
  mesh.add(edges);
  return mesh;
}

function addFaceDetails(headMesh, size = 1.15) {
  const z = size / 2 + 0.01;
  const eyeGeo = new THREE.BoxGeometry(0.14, 0.18, 0.02);
  const leftEye = new THREE.Mesh(eyeGeo, MATERIALS.eye);
  leftEye.position.set(0.22, 0.1, z);
  const rightEye = new THREE.Mesh(eyeGeo, MATERIALS.eye);
  rightEye.position.set(-0.22, 0.1, z);

  const mouthGeo = new THREE.BoxGeometry(0.32, 0.07, 0.02);
  const mouth = new THREE.Mesh(mouthGeo, MATERIALS.eye);
  mouth.position.set(0, -0.2, z);

  headMesh.add(leftEye, rightEye, mouth);
}

function createJointPivot(name, position, jointsMap, showMarker = false) {
  const pivot = new THREE.Group();
  pivot.name = name;
  pivot.position.set(position[0], position[1], position[2]);
  pivot.rotation.order = 'YXZ';
  jointsMap[name] = pivot;

  if (showMarker) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), MATERIALS.jointDot);
    pivot.add(dot);
  }
  return pivot;
}

export function buildR15Rig() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'R15Rig';
  const joints = {};

  // Root (centro do quadril)
  const root = createJointPivot('Root', [0, 2.225, 0], joints);
  rootGroup.add(root);

  const lowerTorso = createBoxPart(1.9, 0.45, 1.0, MATERIALS.lowerTorso, [0, 0, 0]);
  root.add(lowerTorso);

  // Waist
  const waist = createJointPivot('Waist', [0, 0.225, 0], joints);
  root.add(waist);

  const upperTorso = createBoxPart(2.0, 1.45, 1.05, MATERIALS.torso, [0, 0.725, 0]);
  waist.add(upperTorso);

  // Neck + Head
  const neck = createJointPivot('Neck', [0, 1.45, 0], joints);
  waist.add(neck);
  const head = createBoxPart(1.15, 1.15, 1.15, MATERIALS.head, [0, 0.575, 0]);
  addFaceDetails(head, 1.15);
  neck.add(head);

  // Left Arm (+X)
  const leftShoulder = createJointPivot('LeftShoulder', [1.45, 1.25, 0], joints);
  waist.add(leftShoulder);
  leftShoulder.add(createBoxPart(0.85, 0.95, 0.85, MATERIALS.arm, [0, -0.475, 0]));

  const leftElbow = createJointPivot('LeftElbow', [0, -0.95, 0], joints);
  leftShoulder.add(leftElbow);
  leftElbow.add(createBoxPart(0.8, 0.75, 0.8, MATERIALS.forearm, [0, -0.375, 0]));

  const leftWrist = createJointPivot('LeftWrist', [0, -0.75, 0], joints);
  leftElbow.add(leftWrist);
  leftWrist.add(createBoxPart(0.78, 0.35, 0.78, MATERIALS.arm, [0, -0.175, 0]));

  // Right Arm (-X)
  const rightShoulder = createJointPivot('RightShoulder', [-1.45, 1.25, 0], joints);
  waist.add(rightShoulder);
  rightShoulder.add(createBoxPart(0.85, 0.95, 0.85, MATERIALS.arm, [0, -0.475, 0]));

  const rightElbow = createJointPivot('RightElbow', [0, -0.95, 0], joints);
  rightShoulder.add(rightElbow);
  rightElbow.add(createBoxPart(0.8, 0.75, 0.8, MATERIALS.forearm, [0, -0.375, 0]));

  const rightWrist = createJointPivot('RightWrist', [0, -0.75, 0], joints);
  rightElbow.add(rightWrist);
  rightWrist.add(createBoxPart(0.78, 0.35, 0.78, MATERIALS.arm, [0, -0.175, 0]));

  // Left Leg (+X)
  const leftHip = createJointPivot('LeftHip', [0.5, -0.225, 0], joints);
  root.add(leftHip);
  leftHip.add(createBoxPart(0.9, 0.95, 0.9, MATERIALS.leg, [0, -0.475, 0]));

  const leftKnee = createJointPivot('LeftKnee', [0, -0.95, 0], joints);
  leftHip.add(leftKnee);
  leftKnee.add(createBoxPart(0.85, 0.75, 0.85, MATERIALS.leg, [0, -0.375, 0]));

  const leftAnkle = createJointPivot('LeftAnkle', [0, -0.75, 0], joints);
  leftKnee.add(leftAnkle);
  leftAnkle.add(createBoxPart(0.85, 0.3, 0.98, MATERIALS.foot, [0, -0.15, 0.05]));

  // Right Leg (-X)
  const rightHip = createJointPivot('RightHip', [-0.5, -0.225, 0], joints);
  root.add(rightHip);
  rightHip.add(createBoxPart(0.9, 0.95, 0.9, MATERIALS.leg, [0, -0.475, 0]));

  const rightKnee = createJointPivot('RightKnee', [0, -0.95, 0], joints);
  rightHip.add(rightKnee);
  rightKnee.add(createBoxPart(0.85, 0.75, 0.85, MATERIALS.leg, [0, -0.375, 0]));

  const rightAnkle = createJointPivot('RightAnkle', [0, -0.75, 0], joints);
  rightKnee.add(rightAnkle);
  rightAnkle.add(createBoxPart(0.85, 0.3, 0.98, MATERIALS.foot, [0, -0.15, 0.05]));

  return createRigController(rootGroup, joints);
}

export function buildR6Rig() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'R6Rig';
  const joints = {};

  // RootJoint (centro do Torso)
  const rootJoint = createJointPivot('RootJoint', [0, 3.0, 0], joints);
  rootGroup.add(rootJoint);

  const torso = createBoxPart(2.0, 2.0, 1.0, MATERIALS.torso, [0, 0, 0]);
  rootJoint.add(torso);

  // Neck + Head
  const neck = createJointPivot('Neck', [0, 1.0, 0], joints);
  rootJoint.add(neck);
  const head = createBoxPart(1.2, 1.2, 1.2, MATERIALS.head, [0, 0.6, 0]);
  addFaceDetails(head, 1.2);
  neck.add(head);

  // Left Shoulder (+X)
  const leftShoulder = createJointPivot('Left Shoulder', [1.5, 0.75, 0], joints);
  rootJoint.add(leftShoulder);
  leftShoulder.add(createBoxPart(1.0, 2.0, 1.0, MATERIALS.arm, [0, -0.75, 0]));

  // Right Shoulder (-X)
  const rightShoulder = createJointPivot('Right Shoulder', [-1.5, 0.75, 0], joints);
  rootJoint.add(rightShoulder);
  rightShoulder.add(createBoxPart(1.0, 2.0, 1.0, MATERIALS.arm, [0, -0.75, 0]));

  // Left Hip (+X)
  const leftHip = createJointPivot('Left Hip', [0.5, -1.0, 0], joints);
  rootJoint.add(leftHip);
  leftHip.add(createBoxPart(1.0, 2.0, 1.0, MATERIALS.leg, [0, -1.0, 0]));

  // Right Hip (-X)
  const rightHip = createJointPivot('Right Hip', [-0.5, -1.0, 0], joints);
  rootJoint.add(rightHip);
  rightHip.add(createBoxPart(1.0, 2.0, 1.0, MATERIALS.leg, [0, -1.0, 0]));

  return createRigController(rootGroup, joints);
}

function createRigController(group, joints) {
  function applyPose(poseMap = {}) {
    for (const [name, pivot] of Object.entries(joints)) {
      const rot = poseMap[name];
      if (rot && Array.isArray(rot)) {
        pivot.rotation.set(
          (rot[0] || 0) * DEG2RAD,
          (rot[1] || 0) * DEG2RAD,
          (rot[2] || 0) * DEG2RAD
        );
      } else {
        pivot.rotation.set(0, 0, 0);
      }
    }
  }

  function resetPose() {
    applyPose({});
  }

  return { group, joints, applyPose, resetPose };
}

export function buildRig(rigType) {
  return rigType === 'R6' ? buildR6Rig() : buildR15Rig();
}
