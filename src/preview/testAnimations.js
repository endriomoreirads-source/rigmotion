// Animações de teste escritas à mão (JSON) para validar a Etapa 1 (R15 e R6)
// Seguem o formato exato esperado da IA nas próximas etapas.

export const TEST_ANIMATIONS = {
  R15: {
    name: 'teste_golpe_diagonal_r15',
    rig: 'R15',
    fps: 30,
    duration: 1.2,
    loop: true,
    keyframes: [
      {
        time: 0.0,
        easing: 'Linear',
        joints: {
          Root: [0, 0, 0],
          Waist: [0, 0, 0],
          Neck: [0, 0, 0],
          RightShoulder: [10, 0, 10],
          RightElbow: [-25, 0, 0],
          RightWrist: [0, 0, 0],
          LeftShoulder: [15, 15, -15],
          LeftElbow: [-45, 0, 0],
          LeftHip: [0, 0, 0],
          LeftKnee: [5, 0, 0],
          RightHip: [0, 0, 0],
          RightKnee: [5, 0, 0],
        },
      },
      {
        // Antecipação: gira o tronco para trás/direita e ergue o braço direito
        time: 0.3,
        easing: 'CubicOut',
        joints: {
          Root: [6, -20, 0],
          Waist: [-10, -25, 5],
          Neck: [5, 35, 0],
          RightShoulder: [135, -20, 35],
          RightElbow: [-55, 0, 0],
          RightWrist: [-15, 0, 10],
          LeftShoulder: [45, 25, -35],
          LeftElbow: [-85, 0, 0],
          LeftHip: [-18, 10, -5],
          LeftKnee: [25, 0, 0],
          RightHip: [12, -10, 5],
          RightKnee: [18, 0, 0],
        },
      },
      {
        // Impacto: golpe diagonal rápido de cima para baixo
        time: 0.55,
        easing: 'CubicIn',
        joints: {
          Root: [14, 28, -5],
          Waist: [22, 30, -10],
          Neck: [-10, -35, 0],
          RightShoulder: [-45, 35, -25],
          RightElbow: [-15, 0, 0],
          RightWrist: [20, 0, -10],
          LeftShoulder: [-20, -15, -25],
          LeftElbow: [-65, 0, 0],
          LeftHip: [-28, -10, 0],
          LeftKnee: [35, 0, 0],
          RightHip: [22, 10, 0],
          RightKnee: [20, 0, 0],
        },
      },
      {
        // Follow-through leve
        time: 0.78,
        easing: 'CubicOut',
        joints: {
          Root: [10, 22, -3],
          Waist: [15, 20, -6],
          Neck: [-5, -25, 0],
          RightShoulder: [-55, 40, -30],
          RightElbow: [-25, 0, 0],
          RightWrist: [10, 0, -5],
          LeftShoulder: [-10, -10, -20],
          LeftElbow: [-55, 0, 0],
          LeftHip: [-20, -5, 0],
          LeftKnee: [25, 0, 0],
          RightHip: [15, 5, 0],
          RightKnee: [15, 0, 0],
        },
      },
      {
        // Recuperação para a pose inicial
        time: 1.2,
        easing: 'CubicInOut',
        joints: {
          Root: [0, 0, 0],
          Waist: [0, 0, 0],
          Neck: [0, 0, 0],
          RightShoulder: [10, 0, 10],
          RightElbow: [-25, 0, 0],
          RightWrist: [0, 0, 0],
          LeftShoulder: [15, 15, -15],
          LeftElbow: [-45, 0, 0],
          LeftHip: [0, 0, 0],
          LeftKnee: [5, 0, 0],
          RightHip: [0, 0, 0],
          RightKnee: [5, 0, 0],
        },
      },
    ],
  },
  R6: {
    name: 'teste_golpe_diagonal_r6',
    rig: 'R6',
    fps: 30,
    duration: 1.2,
    loop: true,
    keyframes: [
      {
        time: 0.0,
        easing: 'Linear',
        joints: {
          RootJoint: [0, 0, 0],
          Neck: [0, 0, 0],
          'Right Shoulder': [10, 0, 10],
          'Left Shoulder': [20, 15, -15],
          'Left Hip': [0, 0, 0],
          'Right Hip': [0, 0, 0],
        },
      },
      {
        // Antecipação
        time: 0.3,
        easing: 'CubicOut',
        joints: {
          RootJoint: [-8, -28, 6],
          Neck: [5, 25, 0],
          'Right Shoulder': [140, -15, 30],
          'Left Shoulder': [55, 20, -30],
          'Left Hip': [-18, 10, 0],
          'Right Hip': [15, -10, 0],
        },
      },
      {
        // Impacto
        time: 0.55,
        easing: 'CubicIn',
        joints: {
          RootJoint: [18, 34, -10],
          Neck: [-10, -28, 0],
          'Right Shoulder': [-55, 30, -25],
          'Left Shoulder': [-20, -10, -25],
          'Left Hip': [-24, -10, 0],
          'Right Hip': [22, 10, 0],
        },
      },
      {
        // Recuperação
        time: 1.2,
        easing: 'CubicInOut',
        joints: {
          RootJoint: [0, 0, 0],
          Neck: [0, 0, 0],
          'Right Shoulder': [10, 0, 10],
          'Left Shoulder': [20, 15, -15],
          'Left Hip': [0, 0, 0],
          'Right Hip': [0, 0, 0],
        },
      },
    ],
  },
};
