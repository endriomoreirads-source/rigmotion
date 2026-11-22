// Definições dos rigs Roblox R15 (15 Motor6Ds) e R6 (6 Motor6Ds)
// Rotações em graus (Euler XYZ), relativas à pose neutra (braços relaxados ao lado do corpo).

export const R15_JOINTS = [
  'Root',
  'Waist',
  'Neck',
  'LeftShoulder',
  'LeftElbow',
  'LeftWrist',
  'RightShoulder',
  'RightElbow',
  'RightWrist',
  'LeftHip',
  'LeftKnee',
  'LeftAnkle',
  'RightHip',
  'RightKnee',
  'RightAnkle',
];

export const R6_JOINTS = [
  'RootJoint',
  'Neck',
  'Left Shoulder',
  'Right Shoulder',
  'Left Hip',
  'Right Hip',
];

export const RIG_TYPES = {
  R15: {
    id: 'R15',
    label: 'R15 (15 articulações)',
    joints: R15_JOINTS,
  },
  R6: {
    id: 'R6',
    label: 'R6 (6 articulações)',
    joints: R6_JOINTS,
  },
};

// Limites realistas aproximados em graus [min, max] para cada eixo [rx, ry, rz]
// Serão usados também na validação da IA nas próximas etapas.
export const JOINT_LIMITS = {
  // R15
  Root: { x: [-60, 60], y: [-180, 180], z: [-60, 60] },
  Waist: { x: [-45, 55], y: [-60, 60], z: [-35, 35] },
  Neck: { x: [-45, 45], y: [-70, 70], z: [-30, 30] },
  LeftShoulder: { x: [-175, 175], y: [-90, 90], z: [-175, 45] },
  LeftElbow: { x: [-145, 10], y: [-30, 30], z: [-20, 20] },
  LeftWrist: { x: [-70, 70], y: [-45, 45], z: [-45, 45] },
  RightShoulder: { x: [-175, 175], y: [-90, 90], z: [-45, 175] },
  RightElbow: { x: [-145, 10], y: [-30, 30], z: [-20, 20] },
  RightWrist: { x: [-70, 70], y: [-45, 45], z: [-45, 45] },
  LeftHip: { x: [-120, 80], y: [-45, 45], z: [-60, 30] },
  LeftKnee: { x: [-10, 145], y: [-15, 15], z: [-10, 10] },
  LeftAnkle: { x: [-50, 50], y: [-25, 25], z: [-25, 25] },
  RightHip: { x: [-120, 80], y: [-45, 45], z: [-30, 60] },
  RightKnee: { x: [-10, 145], y: [-15, 15], z: [-10, 10] },
  RightAnkle: { x: [-50, 50], y: [-25, 25], z: [-25, 25] },

  // R6
  RootJoint: { x: [-60, 60], y: [-180, 180], z: [-60, 60] },
  'Left Shoulder': { x: [-175, 175], y: [-90, 90], z: [-175, 45] },
  'Right Shoulder': { x: [-175, 175], y: [-90, 90], z: [-45, 175] },
  'Left Hip': { x: [-120, 80], y: [-45, 45], z: [-60, 30] },
  'Right Hip': { x: [-120, 80], y: [-45, 45], z: [-30, 60] },
};

export function getJointList(rigType) {
  return rigType === 'R6' ? R6_JOINTS : R15_JOINTS;
}
