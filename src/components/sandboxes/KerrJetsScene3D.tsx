import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type OrbitDirection = 'prograde' | 'retrograde';

// ---------------------------------------------------------------------------
// Аналитика метрики Керра (в единицах r_s = 2GM/c^2).
// Экспортируется, чтобы страница и 3D-сцена использовали одни и те же формулы.
// ---------------------------------------------------------------------------

/** Внешний горизонт событий: r_+ = 0.5 * r_s * (1 + sqrt(1 - a*^2)) */
export const getHorizonRadius = (spinA: number): number =>
  0.5 * (1 + Math.sqrt(Math.max(0.0001, 1 - spinA * spinA)));

/** ISCO при попутном вращении: сжимается от 3.0 r_s до 0.5 r_s */
export const getProgradeISCO = (spinA: number): number => 3.0 - 2.5 * Math.pow(spinA, 0.82);

/** ISCO при встречном вращении: расширяется от 3.0 r_s до 4.5 r_s */
export const getRetrogradeISCO = (spinA: number): number => 3.0 + 1.5 * spinA;

export const getIscoRadius = (spinA: number, direction: OrbitDirection): number =>
  direction === 'prograde' ? getProgradeISCO(spinA) : getRetrogradeISCO(spinA);

// ---------------------------------------------------------------------------
// 3D-сцена
// ---------------------------------------------------------------------------

export interface KerrJetsScene3DProps {
  spinA: number;
  magneticFieldB: number;
  orbitDirection: OrbitDirection;
  madState: boolean;
  showErgosphere: boolean;
  showAccretionDisk: boolean;
  showMagneticHelix: boolean;
  showFrameDraggingGrid: boolean;
  className?: string;
}

export default function KerrJetsScene3D({
  spinA,
  magneticFieldB,
  orbitDirection,
  madState,
  showErgosphere,
  showAccretionDisk,
  showMagneticHelix,
  showFrameDraggingGrid,
  className = 'flex-1 w-full h-full cursor-grab active:cursor-grabbing',
}: KerrJetsScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Ссылка на актуальные параметры для цикла Three.js (чтобы не пересоздавать сцену)
  const stateRef = useRef({
    spinA,
    magneticFieldB,
    orbitDirection,
    madState,
    showErgosphere,
    showAccretionDisk,
    showMagneticHelix,
    showFrameDraggingGrid,
  });

  useEffect(() => {
    stateRef.current = {
      spinA,
      magneticFieldB,
      orbitDirection,
      madState,
      showErgosphere,
      showAccretionDisk,
      showMagneticHelix,
      showFrameDraggingGrid,
    };
  }, [
    spinA,
    magneticFieldB,
    orbitDirection,
    madState,
    showErgosphere,
    showAccretionDisk,
    showMagneticHelix,
    showFrameDraggingGrid,
  ]);

  // Инициализация WebGL-сцены Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8.0, 5.2, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 28;
    controls.minDistance = 2.5;

    // 1. Внешний горизонт событий Керра (r_+)
    const horizonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x020617 })
    );
    scene.add(horizonMesh);

    // 2. Сплюснутая оболочка Эргосферы (фиолетовый каркас, касающийся горизонта на полюсах)
    const ergoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 36, 24),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
      })
    );
    scene.add(ergoMesh);

    // 3. Вихревые линии увлечения инерциальных систем отсчёта (Frame-Dragging / Лензе — Тирринг)
    const draggingGroup = new THREE.Group();
    scene.add(draggingGroup);

    const draggingLines: { line: THREE.Line; baseRadius: number; yLevel: number }[] = [];
    const radiiLevels = [1.45, 2.1, 2.9, 3.8];
    const yLevels = [-0.6, 0, 0.6];

    yLevels.forEach((y) => {
      radiiLevels.forEach((r) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 48; i++) {
          const ang = (i / 48) * Math.PI * 1.65;
          pts.push(new THREE.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0.22,
        });
        const line = new THREE.Line(geo, mat);
        draggingGroup.add(line);
        draggingLines.push({ line, baseRadius: r, yLevel: y });
      });
    });

    // 4. Кольцо текущей границы ISCO (жёлтый пунктир)
    const iscoCurve = new THREE.EllipseCurve(0, 0, 1.0, 1.0, 0, Math.PI * 2, false, 0);
    const iscoPoints = iscoCurve.getPoints(72).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const iscoGeo = new THREE.BufferGeometry().setFromPoints(iscoPoints);
    const iscoMat = new THREE.LineDashedMaterial({
      color: 0xfbbf24,
      dashSize: 0.22,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.9,
    });
    const iscoLine = new THREE.Line(iscoGeo, iscoMat);
    iscoLine.computeLineDistances();
    scene.add(iscoLine);

    // 5. Аккреционный диск с релятивистским доплеровским усилением (Doppler beaming)
    const diskCount = 1100;
    const diskPositions = new Float32Array(diskCount * 3);
    const diskColors = new Float32Array(diskCount * 3);
    const diskAngles = new Float32Array(diskCount);
    const diskNormalizedR = new Float32Array(diskCount);

    for (let i = 0; i < diskCount; i++) {
      diskAngles[i] = Math.random() * Math.PI * 2;
      diskNormalizedR[i] = Math.random(); // от 0 (на кромке ISCO) до 1 (внешний край диска)
    }

    const diskGeo = new THREE.BufferGeometry();
    diskGeo.setAttribute('position', new THREE.BufferAttribute(diskPositions, 3));
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));
    const diskPoints = new THREE.Points(
      diskGeo,
      new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
      })
    );
    scene.add(diskPoints);

    // 6. Спиральные магнитные башни (Механизм Блэндфорда — Знаека)
    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    const createMagneticHelix = (dir: 1 | -1, phase: number, colorHex: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 110; i++) {
        const t = i / 110;
        const y = dir * (0.55 + t * 9.0);
        const radius = 0.22 + Math.pow(t, 0.68) * 1.45;
        const angle = t * Math.PI * 9 + phase;
        pts.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.7,
      });
      return new THREE.Line(geo, mat);
    };

    helixGroup.add(createMagneticHelix(1, 0, 0x38bdf8));
    helixGroup.add(createMagneticHelix(1, Math.PI, 0x818cf8));
    helixGroup.add(createMagneticHelix(-1, 0, 0x38bdf8));
    helixGroup.add(createMagneticHelix(-1, Math.PI, 0x818cf8));

    // 7. Биполярные релятивистские джеты (поток электронно-позитронной плазмы из полюсов)
    const jetCount = 380;
    const jetPositions = new Float32Array(jetCount * 3);
    const jetProgress = new Float32Array(jetCount);
    for (let i = 0; i < jetCount; i++) {
      jetProgress[i] = Math.random();
    }
    const jetGeo = new THREE.BufferGeometry();
    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    const jetMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.15,
      transparent: true,
      opacity: 0.95,
    });
    const jetPoints = new THREE.Points(jetGeo, jetMat);
    scene.add(jetPoints);

    let animId = 0;
    let time = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      controls.update();

      const st = stateRef.current;
      time += 0.022;

      // 1. Размер горизонта r_+ уменьшается при росте спина a*
      const currentRPlus = getHorizonRadius(st.spinA);
      horizonMesh.scale.setScalar(currentRPlus);

      // 2. Эргосфера касается горизонта на полюсах (Y = r_+) и расширяется на экваторе
      ergoMesh.visible = st.showErgosphere && st.spinA > 0.02;
      const eqRadius = 1.0 + st.spinA * 0.35;
      ergoMesh.scale.set(eqRadius, currentRPlus * 1.02, eqRadius);
      ergoMesh.rotation.y = time * st.spinA * 1.8;

      // 3. Вращение вихревых линий увлечения пространства (Лензе — Тирринг)
      draggingGroup.visible = st.showFrameDraggingGrid && st.spinA > 0.02;
      draggingLines.forEach(({ line, baseRadius }) => {
        // Угловая скорость увлечения пространства omega ~ a* / r^3
        line.rotation.y += (0.035 * st.spinA) / Math.pow(baseRadius, 1.6);
      });

      // 4. Радиус кольца ISCO в зависимости от спина и направления вращения диска
      const currentISCO = getIscoRadius(st.spinA, st.orbitDirection);
      iscoLine.scale.setScalar(currentISCO);

      // 5. Движение аккреционного диска
      diskPoints.visible = st.showAccretionDisk;
      const dPos = diskGeo.attributes.position.array as Float32Array;
      const dCol = diskGeo.attributes.color.array as Float32Array;
      const dirSign = st.orbitDirection === 'prograde' ? 1 : -1;

      for (let i = 0; i < diskCount; i++) {
        const r = currentISCO + diskNormalizedR[i] * 4.2;
        const angularSpeed = (0.055 / Math.pow(r, 1.15)) * dirSign;
        diskAngles[i] += angularSpeed;

        const x = Math.cos(diskAngles[i]) * r;
        const z = Math.sin(diskAngles[i]) * r;
        const verticalThickness = st.madState ? 0.16 : 0.07;

        dPos[i * 3] = x;
        dPos[i * 3 + 1] = Math.sin(diskAngles[i] * 3 + i) * verticalThickness * (r / 4);
        dPos[i * 3 + 2] = z;

        // Релятивистский эффект Доплера: приближающееся к наблюдателю крыло диска сияет ярче
        const dopplerBoost = 0.65 + 0.35 * Math.cos(diskAngles[i]) * dirSign;
        const innerHeat = 1 - diskNormalizedR[i] * 0.55;
        dCol[i * 3] = Math.min(1, 0.98 * dopplerBoost * innerHeat + 0.15);
        dCol[i * 3 + 1] = Math.min(1, 0.58 * dopplerBoost * innerHeat);
        dCol[i * 3 + 2] = Math.min(1, (st.madState ? 0.55 : 0.25) * dopplerBoost);
      }
      diskGeo.attributes.position.needsUpdate = true;
      diskGeo.attributes.color.needsUpdate = true;

      // 6. Магнитная спираль и джеты Блэндфорда — Знаека
      const jetStrength = st.spinA * st.magneticFieldB * (st.madState ? 1.2 : 1.0);
      const isJetActive = jetStrength > 0.06;

      helixGroup.visible = st.showMagneticHelix && isJetActive;
      helixGroup.rotation.y = time * (0.8 + st.spinA * 2.8);
      const colRadius = st.madState ? 0.82 : 1.0; // В режиме MAD поле сильнее коллимирует джет
      helixGroup.scale.set(colRadius, 0.35 + jetStrength * 0.85, colRadius);

      jetPoints.visible = isJetActive;
      if (isJetActive) {
        const jPos = jetGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < jetCount; i++) {
          jetProgress[i] += 0.014 * (0.35 + jetStrength * 1.45);
          if (jetProgress[i] > 1) jetProgress[i] = 0;

          const poleDir = i % 2 === 0 ? 1 : -1;
          const t = jetProgress[i];
          const y = poleDir * (currentRPlus + t * 9.0);
          const coneSpread = (0.12 + t * 0.65) * colRadius;
          const swirlAngle = t * 15 * st.spinA + i;

          jPos[i * 3] = Math.cos(swirlAngle) * coneSpread;
          jPos[i * 3 + 1] = y;
          jPos[i * 3 + 2] = Math.sin(swirlAngle) * coneSpread;
        }
        jetGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();

      // Освобождаем GPU-ресурсы
      scene.traverse((obj) => {
        const o = obj as THREE.Mesh | THREE.Line | THREE.Points;
        if (o.geometry) o.geometry.dispose();
        const material = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else if (material) material.dispose();
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}