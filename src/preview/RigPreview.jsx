import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildRig } from './robloxRigMesh.js';
import { evaluateAnimationAtTime } from '../rig/index.js';

export default function RigPreview({ rigType, animation, currentTime }) {
  const containerRef = useRef(null);
  const rigControllerRef = useRef(null);
  const sceneRef = useRef(null);

  // Inicializa cena Three.js + câmera orbital uma única vez
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e14);
    sceneRef.current = scene;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 4.0, 8.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 2.5, 0);
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.update();

    // Iluminação estilo estúdio
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.45);
    scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -2;
    scene.add(dirLight);

    // Chão + Grid (referência de studs)
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    grid.position.y = 0.005;
    scene.add(grid);

    // Resize responsivo
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Reconstrói o boneco quando rigType muda (R15 <-> R6)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (rigControllerRef.current) {
      scene.remove(rigControllerRef.current.group);
    }

    const controller = buildRig(rigType);
    rigControllerRef.current = controller;
    scene.add(controller.group);

    if (animation && animation.rig === rigType) {
      controller.applyPose(evaluateAnimationAtTime(animation, currentTime));
    } else {
      controller.resetPose();
    }
  }, [rigType]);

  // Atualiza a pose do boneco conforme o tempo da linha do tempo
  useEffect(() => {
    const controller = rigControllerRef.current;
    if (!controller) return;

    if (animation && animation.rig === rigType) {
      const pose = evaluateAnimationAtTime(animation, currentTime);
      controller.applyPose(pose);
    } else {
      controller.resetPose();
    }
  }, [animation, currentTime, rigType]);

  return <div ref={containerRef} className="preview-canvas-container" />;
}
