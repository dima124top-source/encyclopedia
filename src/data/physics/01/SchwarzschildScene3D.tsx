// src/components/sandboxes/SchwarzschildScene3D.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, RotateCcw } from 'lucide-react';

export interface SchwarzschildSceneProps {
  mass: number;
  halfWidth: number;
  impactB: number;
  probeRadius: number;
  showHorizon: boolean;
  showPhotonSphere: boolean;
  showLightRays: boolean;
  showCentralPlanes: boolean;
  flatComparison: boolean;
  dustTrigger: number;
  onAnimateGravityFromZero: () => void;
  onSpawnDust: () => void;
}

export default function SchwarzschildScene3D({
  mass,
  halfWidth,
  impactB,
  probeRadius,
  showHorizon,
  showPhotonSphere,
  showLightRays,
  showCentralPlanes,
  flatComparison,
  dustTrigger,
  onAnimateGravityFromZero,
  onSpawnDust,
}: SchwarzschildSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const dustParticlesRef = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3 }[]>([]);
  const dustGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const probeStateRef = useRef<{ angle: number; r: number }>({
    angle: 0,
    r: probeRadius,
  });

  // Функция генерации облака падающей пыли (160 частиц из самого первого кода)
  const initDustCloud = () => {
    const newParticles: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < 160; i++) {
      const radius = 3.2 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) * 0.4,
        radius * Math.cos(phi)
      );
      const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).multiplyScalar(0.035);
      newParticles.push({ pos, vel: tangent });
    }
    dustParticlesRef.current = newParticles;
  };

  // Перезапуск облака пыли при нажатии кнопки
  useEffect(() => {
    initDustCloud();
  }, [dustTrigger]);

  // Синхронизация радиуса спутника при движении ползунка
  useEffect(() => {
    probeStateRef.current.r = probeRadius;
  }, [probeRadius]);

  const stateRef = useRef({
    mass,
    halfWidth,
    impactB,
    probeRadius,
    showHorizon,
    showPhotonSphere,
    showLightRays,
    showCentralPlanes,
    flatComparison,
  });

  useEffect(() => {
    stateRef.current = {
      mass,
      halfWidth,
      impactB,
      probeRadius,
      showHorizon,
      showPhotonSphere,
      showLightRays,
      showCentralPlanes,
      flatComparison,
    };
  }, [
    mass,
    halfWidth,
    impactB,
    probeRadius,
    showHorizon,
    showPhotonSphere,
    showLightRays,
    showCentralPlanes,
    flatComparison,
  ]);

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
    camera.position.set(7.5, 5.5, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 28;
    controls.minDistance = 2.2;

    // 1. Создание объёмной 3D-сетки пространства с голубыми центральными плоскостями
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    const lineStep = 2;
    const gridMax = 6;
    const segments = 36;

    interface GridLineData {
      line: THREE.Line;
      basePoints: THREE.Vector3[];
      isCentral: boolean;
    }
    const gridLines: GridLineData[] = [];

    const createGridLine = (start: THREE.Vector3, end: THREE.Vector3, isCentral: boolean) => {
      const basePoints: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        basePoints.push(new THREE.Vector3().lerpVectors(start, end, i / segments));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(basePoints);
      const material = new THREE.LineBasicMaterial({
        color: isCentral ? 0x38bdf8 : 0x475569,
        transparent: true,
        opacity: isCentral ? 0.65 : 0.28,
      });
      const line = new THREE.Line(geometry, material);
      gridGroup.add(line);
      gridLines.push({ line, basePoints, isCentral });
    };

    for (let a = -gridMax; a <= gridMax; a += lineStep) {
      for (let b = -gridMax; b <= gridMax; b += lineStep) {
        const isCentral = a === 0 || b === 0;
        createGridLine(new THREE.Vector3(-gridMax, a, b), new THREE.Vector3(gridMax, a, b), isCentral);
        createGridLine(new THREE.Vector3(a, -gridMax, b), new THREE.Vector3(a, gridMax, b), isCentral);
        createGridLine(new THREE.Vector3(a, b, -gridMax), new THREE.Vector3(a, b, gridMax), isCentral);
      }
    }

    // 2. Горизонт событий (1.0 r_s) + голубой wireframe-ореол (1.04 r_s)
    const horizonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x020617 })
    );
    scene.add(horizonMesh);

    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.25,
        wireframe: true,
      })
    );
    scene.add(glowMesh);

    // 3. Фотонная сфера (1.5 r_s) и пунктирное кольцо границы ISCO (3.0 r_s)
    const photonGroup = new THREE.Group();
    const photonSphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 28, 28),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
    );
    photonGroup.add(photonSphereMesh);

    const iscoCurve = new THREE.EllipseCurve(0, 0, 3.0, 3.0, 0, Math.PI * 2, false, 0);
    const iscoPoints = iscoCurve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const iscoGeo = new THREE.BufferGeometry().setFromPoints(iscoPoints);
    const iscoMat = new THREE.LineDashedMaterial({
      color: 0xfbbf24,
      dashSize: 0.25,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const iscoLine = new THREE.Line(iscoGeo, iscoMat);
    iscoLine.computeLineDistances();
    photonGroup.add(iscoLine);
    scene.add(photonGroup);

    // 4. Пучок из 6 фоновых световых лучей + Главный управляемый луч (Прицельный параметр b)
    const lightGroup = new THREE.Group();
    scene.add(lightGroup);

    const impactParams = [-4.2, -3.0, -2.1, 2.1, 3.0, 4.2];
    const lightLines: { line: THREE.Line; b: number }[] = [];

    impactParams.forEach((b) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        pts.push(new THREE.Vector3(-8 + (i / 60) * 16, 0.4, b));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.45,
      });
      const line = new THREE.Line(geo, mat);
      lightGroup.add(line);
      lightLines.push({ line, b });
    });

    const customRayGeo = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 90 }, () => new THREE.Vector3())
    );
    const customRayMat = new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 2 });
    const customRayLine = new THREE.Line(customRayGeo, customRayMat);
    lightGroup.add(customRayLine);

    // 5. Орбитальный пробный спутник и его след
    const probeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    scene.add(probeMesh);

    const probeTrailPoints = Array.from({ length: 70 }, () => new THREE.Vector3(3.5, 0, 0));
    const probeTrailGeo = new THREE.BufferGeometry().setFromPoints(probeTrailPoints);
    const probeTrailMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.65,
    });
    const probeTrailLine = new THREE.Line(probeTrailGeo, probeTrailMat);
    scene.add(probeTrailLine);

    // 6. Облако падающей пыли (160 частиц)
    const maxDust = 160;
    const dustPositions = new Float32Array(maxDust * 3);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometryRef.current = dustGeo;
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xf43f5e, size: 0.14, transparent: true, opacity: 0.9 })
    );
    scene.add(dustPoints);
    initDustCloud();

    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      controls.update();

      const st = stateRef.current;
      const effectiveMass = st.flatComparison ? 0 : st.mass;
      const scaleRatio = 6 / st.halfWidth;
      gridGroup.scale.setScalar(scaleRatio);

      horizonMesh.visible = st.showHorizon;
      glowMesh.visible = st.showHorizon;
      horizonMesh.scale.setScalar(Math.max(0.15, effectiveMass));
      glowMesh.scale.setScalar(Math.max(0.16, effectiveMass * 1.04));

      photonGroup.visible = st.showPhotonSphere;
      photonGroup.scale.setScalar(Math.max(0.15, effectiveMass));

      lightGroup.visible = st.showLightRays;

      // Радиальная деформация 3D-сетки
      gridLines.forEach(({ line, basePoints, isCentral }) => {
        if (st.showCentralPlanes && !isCentral) {
          line.visible = false;
          return;
        }
        line.visible = true;
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < basePoints.length; i++) {
          const bp = basePoints[i];
          const r = bp.length();
          const pull =
            effectiveMass > 0
              ? Math.max(0.18, 1 - (effectiveMass * 1.45) / Math.max(r, 1.15))
              : 1;
          posAttr.setXYZ(i, bp.x * pull, bp.y * pull, bp.z * pull);
        }
        posAttr.needsUpdate = true;
      });

      // Обновление 6 фоновых лучей света
      lightLines.forEach(({ line, b }) => {
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const sign = Math.sign(b);
        const absB = Math.abs(b);
        for (let i = 0; i <= 60; i++) {
          const x = -8 + (i / 60) * 16;
          const r = Math.sqrt(x * x + b * b);
          const bend = (effectiveMass * 2.4) / Math.max(absB * r * 0.45, 0.9);
          const zDeflected = b - sign * bend * Math.exp(-(x * x) / 18);
          posAttr.setXYZ(i, x, 0.35, zDeflected);
        }
        posAttr.needsUpdate = true;
      });

      // Трассировка управляемого лазерного луча с прицельным параметром b
      const rayAttr = customRayLine.geometry.attributes.position as THREE.BufferAttribute;
      const bCrit = 2.6 * Math.max(0.2, effectiveMass);
      const bVal = st.impactB * Math.max(0.2, effectiveMass);

      for (let i = 0; i < 90; i++) {
        const t = i / 89;
        if (bVal < bCrit && effectiveMass > 0.1) {
          const x = -8 + t * 8.2;
          const spiralAngle = t * Math.PI * 1.6;
          const rDecay = bVal * (1 - t * 0.85);
          const z =
            x < 0
              ? bVal * Math.exp(-Math.pow((x + 8) / 6, 2))
              : Math.cos(spiralAngle) * rDecay * 0.5;
          const y = x < 0 ? 0.2 : Math.sin(spiralAngle) * rDecay * 0.5;
          rayAttr.setXYZ(i, x < 0 ? x : Math.sin(spiralAngle) * rDecay, y, z);
        } else if (Math.abs(bVal - bCrit) <= 0.12 && effectiveMass > 0.1) {
          const rPhoton = 1.5 * effectiveMass;
          if (t < 0.35) {
            const x = -8 + (t / 0.35) * 8;
            rayAttr.setXYZ(i, x, 0.2, bVal - (bVal - rPhoton) * (t / 0.35));
          } else {
            const angle = ((t - 0.35) / 0.65) * Math.PI * 3.5;
            rayAttr.setXYZ(i, Math.sin(angle) * rPhoton, 0.2, Math.cos(angle) * rPhoton);
          }
        } else {
          const x = -8 + t * 16;
          const r = Math.sqrt(x * x + bVal * bVal);
          const bend = (effectiveMass * 2.8) / Math.max(bVal * r * 0.4, 0.85);
          const zDeflected = bVal - bend * Math.exp(-(x * x) / 18);
          rayAttr.setXYZ(i, x, 0.2, zDeflected);
        }
      }
      rayAttr.needsUpdate = true;

      // Движение пробного спутника относительно границы ISCO (3.0 r_s)
      const pState = probeStateRef.current;
      const iscoRadius = 3.0;
      const scaledR = pState.r * Math.max(0.2, effectiveMass);
      pState.angle += 0.045 / Math.max(0.8, Math.sqrt(scaledR));

      if (st.probeRadius < iscoRadius && effectiveMass > 0.1) {
        pState.r = Math.max(0.95, pState.r - 0.012);
        if (pState.r <= 0.98) pState.r = st.probeRadius; // цикличный перезапуск срыва
        probeMesh.material.color.setHex(0xf43f5e);
        probeTrailMat.color.setHex(0xf43f5e);
      } else {
        pState.r = st.probeRadius;
        probeMesh.material.color.setHex(0x34d399);
        probeTrailMat.color.setHex(0x34d399);
      }

      const px = Math.cos(pState.angle) * (pState.r * Math.max(0.2, effectiveMass));
      const pz = Math.sin(pState.angle) * (pState.r * Math.max(0.2, effectiveMass));
      probeMesh.position.set(px, 0, pz);

      const trailAttr = probeTrailLine.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 69; i > 0; i--) {
        trailAttr.setXYZ(i, trailAttr.getX(i - 1), trailAttr.getY(i - 1), trailAttr.getZ(i - 1));
      }
      trailAttr.setXYZ(0, px, 0, pz);
      trailAttr.needsUpdate = true;

      // Движение облака падающей пыли
      if (dustGeometryRef.current) {
        const particles = dustParticlesRef.current;
        const posArr = dustGeometryRef.current.attributes.position.array as Float32Array;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const r = p.pos.length();
          if (r > Math.max(0.8, effectiveMass)) {
            const accel = p.pos
              .clone()
              .normalize()
              .multiplyScalar((-0.012 * Math.max(0.1, effectiveMass)) / (r * r + 0.4));
            p.vel.add(accel);
            p.pos.add(p.vel);
          } else {
            const angle = Math.random() * Math.PI * 2;
            p.pos.set(Math.cos(angle) * 6, (Math.random() - 0.5) * 2, Math.sin(angle) * 6);
            p.vel.set(-Math.sin(angle) * 0.035, 0, Math.cos(angle) * 0.035);
          }
          posArr[i * 3] = p.pos.x;
          posArr[i * 3 + 1] = p.pos.y;
          posArr[i * 3 + 2] = p.pos.z;
        }
        dustGeometryRef.current.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const extraDistanceRs = (mass * 1.94).toFixed(2);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 flex flex-col">
      {/* Верхний оверлей-легенда из первого варианта */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-sky-400 inline-block" />
            Горизонт (1.0 r_s)
          </span>
          <span className="flex items-center gap-1.5 text-sky-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400/40 border border-sky-400 inline-block" />
            Фотонная сфера (1.5 r_s)
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
            ISCO (3.0 r_s)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            ● Зонд ({probeRadius.toFixed(1)} r_s)
          </span>
          <span className="flex items-center gap-1.5 text-yellow-300">
            ━ Луч (b = {impactB.toFixed(2)})
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 font-mono">
          ЛКМ — вращение · Колесо — зум
        </div>
      </div>

      {/* WebGL Холст */}
      <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Нижняя быстрая панель из первого варианта */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800">
        <div className="flex items-center gap-4 text-xs font-mono px-2">
          <div>
            <span className="text-slate-500">Масса: </span>
            <span className="text-sky-400 font-bold">{(mass * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Растяжение: </span>
            <span className="text-emerald-400 font-bold">+{extraDistanceRs} r_s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAnimateGravityFromZero}
            className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Гравитация с нуля</span>
          </button>

          <button
            onClick={onSpawnDust}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Облако пыли</span>
          </button>
        </div>
      </div>
    </div>
  );
}