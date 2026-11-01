import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  Sliders,
  Award,
  HelpCircle,
  Compass,
  Zap,
} from 'lucide-react';

interface SchwarzschildLabProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';
type TheoryChapter = 'metric' | 'photon' | 'isco';
type AudienceLevel = 'school' | 'university';
type FormulaHighlight = 'ds' | 'dt' | 'dr' | 'domega' | null;

export default function SchwarzschildLab({ onBack }: SchwarzschildLabProps) {
  // Навигация внутри урока
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [theoryChapter, setTheoryChapter] = useState<TheoryChapter>('metric');
  const [audience, setAudience] = useState<AudienceLevel>('university');
  const [highlightedTerm, setHighlightedTerm] = useState<FormulaHighlight>(null);

  // Параметры 3D-симуляции
  const [mass, setMass] = useState<number>(1.0); // 0.1 - 1.5 r_s
  const [impactParamB, setImpactParamB] = useState<number>(2.6); // Прицельный параметр луча (критический ~ 2.6 r_s)
  const [probeRadius, setProbeRadius] = useState<number>(3.5); // Радиус орбиты пробного спутника в r_s
  const [showHorizon, setShowHorizon] = useState<boolean>(true);
  const [showPhotonSphere, setShowPhotonSphere] = useState<boolean>(true);
  const [showLightRays, setShowLightRays] = useState<boolean>(true);
  const [showCentralPlanes, setShowCentralPlanes] = useState<boolean>(false);
  const [flatComparison, setFlatComparison] = useState<boolean>(false);

  // Состояние задач
  const [task1Answer, setTask1Answer] = useState<string | null>(null);
  const [showHint1, setShowHint1] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);

  // Ссылки для Three.js
  const mountRef = useRef<HTMLDivElement | null>(null);
  const dustParticlesRef = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3 }[]>([]);
  const dustGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const probeStateRef = useRef<{ angle: number; r: number; falling: boolean }>({
    angle: 0,
    r: 3.5,
    falling: false,
  });

  // Сброс и перезапуск орбитального спутника при смене радиуса
  const launchProbeAtRadius = (newR: number) => {
    setProbeRadius(newR);
    probeStateRef.current = {
      angle: 0,
      r: newR,
      falling: newR < 3.0 * mass,
    };
  };

  // Плавное включение гравитации с нуля
  const animateGravityFromZero = () => {
    setFlatComparison(false);
    setMass(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 0.05;
      if (current >= 1.0) {
        setMass(1.0);
        clearInterval(interval);
      } else {
        setMass(Number(current.toFixed(2)));
      }
    }, 35);
  };

  // Спавн облака падающей пыли
  const spawnDustCloud = () => {
    const newParticles: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
    for (let i = 0; i < 150; i++) {
      const radius = 3.2 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) * 0.35,
        radius * Math.cos(phi)
      );
      const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).multiplyScalar(0.035);
      newParticles.push({ pos, vel: tangent });
    }
    dustParticlesRef.current = newParticles;
  };

  const stateRef = useRef({
    mass,
    impactParamB,
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
      impactParamB,
      probeRadius,
      showHorizon,
      showPhotonSphere,
      showLightRays,
      showCentralPlanes,
      flatComparison,
    };
  }, [
    mass,
    impactParamB,
    probeRadius,
    showHorizon,
    showPhotonSphere,
    showLightRays,
    showCentralPlanes,
    flatComparison,
  ]);

  // Инициализация Three.js
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
    camera.position.set(7.5, 6.0, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 28;
    controls.minDistance = 2.2;

    // 1. 3D-сетка пространства
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
        opacity: isCentral ? 0.6 : 0.24,
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

    // 2. Горизонт событий (1.0 r_s)
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

    // 3. Фотонная сфера (1.5 r_s) и граница устойчивых орбит ISCO (3.0 r_s)
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

    // Кольцо ISCO (3.0 r_s)
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

    // 4. Фоновый пучок световых лучей + Главный управляемый луч (Прицельный параметр b)
    const lightGroup = new THREE.Group();
    scene.add(lightGroup);

    const customRayGeo = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 90 }, () => new THREE.Vector3())
    );
    const customRayMat = new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 2 });
    const customRayLine = new THREE.Line(customRayGeo, customRayMat);
    lightGroup.add(customRayLine);

    // 5. Орбитальный пробный спутник для демонстрации границы ISCO (3.0 r_s)
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

    // 6. Облако падающей пыли
    const maxDust = 150;
    const dustPositions = new Float32Array(maxDust * 3);
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometryRef.current = dustGeo;
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xf43f5e, size: 0.13, transparent: true, opacity: 0.85 })
    );
    scene.add(dustPoints);
    spawnDustCloud();

    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      controls.update();

      const st = stateRef.current;
      const effectiveMass = st.flatComparison ? 0 : st.mass;

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

      // Трассировка управляемого лазерного луча с прицельным параметром b
      const rayAttr = customRayLine.geometry.attributes.position as THREE.BufferAttribute;
      const bCrit = 2.6 * Math.max(0.2, effectiveMass);
      const bVal = st.impactParamB;

      for (let i = 0; i < 90; i++) {
        const t = i / 89;
        if (bVal < bCrit && effectiveMass > 0.1) {
          // Захват луча за горизонт событий при b < 2.6 r_s
          const x = -8 + t * 8.2;
          const spiralAngle = t * Math.PI * 1.6;
          const rDecay = bVal * (1 - t * 0.85);
          const z =
            x < 0
              ? bVal * Math.exp(-Math.pow((x + 8) / 6, 2))
              : Math.cos(spiralAngle) * rDecay * 0.5;
          const y = x < 0 ? 0.2 : Math.sin(spiralAngle) * rDecay * 0.5;
          rayAttr.setXYZ(i, x < 0 ? x : Math.sin(spiralAngle) * rDecay, y, z);
        } else if (Math.abs(bVal - bCrit) <= 0.15 && effectiveMass > 0.1) {
          // Намотка на фотонную сферу (1.5 r_s) при b ≈ 2.6 r_s
          const rPhoton = 1.5 * effectiveMass;
          if (t < 0.35) {
            const x = -8 + (t / 0.35) * 8;
            rayAttr.setXYZ(i, x, 0.2, bVal - (bVal - rPhoton) * (t / 0.35));
          } else {
            const angle = ((t - 0.35) / 0.65) * Math.PI * 3.5;
            rayAttr.setXYZ(
              i,
              Math.sin(angle) * rPhoton,
              0.2,
              Math.cos(angle) * rPhoton
            );
          }
        } else {
          // Гравитационное отклонение (линзирование) при b > 2.6 r_s
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
      const iscoRadius = 3.0 * Math.max(0.2, effectiveMass);
      pState.angle += 0.045 / Math.max(0.8, Math.sqrt(pState.r));

      if (pState.r < iscoRadius && effectiveMass > 0.1) {
        // Внутри ISCO (r < 3.0 r_s) круговые орбиты неустойчивы — срыв в спираль падения!
        pState.r = Math.max(effectiveMass * 0.95, pState.r - 0.012);
        probeMesh.material.color.setHex(0xf43f5e); // Красный сигнал срыва орбиты
      } else {
        pState.r = st.probeRadius;
        probeMesh.material.color.setHex(0x34d399); // Изумрудный — стабильная орбита
      }

      const px = Math.cos(pState.angle) * pState.r;
      const pz = Math.sin(pState.angle) * pState.r;
      probeMesh.position.set(px, 0, pz);

      // Обновление хвоста орбиты спутника
      const trailAttr = probeTrailLine.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 69; i > 0; i--) {
        trailAttr.setXYZ(
          i,
          trailAttr.getX(i - 1),
          trailAttr.getY(i - 1),
          trailAttr.getZ(i - 1)
        );
      }
      trailAttr.setXYZ(0, px, 0, pz);
      trailAttr.needsUpdate = true;

      // Движение облака пыли
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
  const bCritValue = (2.6 * mass).toFixed(2);
  const iscoValue = (3.0 * mass).toFixed(2);
  const isTask2Solved = Math.abs(probeRadius - 3.0 * mass) <= 0.15;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ШАПКА УРОКА */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>К списку лекций</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                Лекция 1 · Статичная чёрная дыра
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Шварцшильд · Фотонная сфера · ISCO
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              Метрика Шварцшильда, захват света и граница ISCO
            </h1>
          </div>
        </div>

        {/* Переключатель 3 основных шагов */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Теория (3 главы)</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'controls'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Песочница</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tasks'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>3. Задачи (2)</span>
          </button>
        </div>
      </header>

      {/* РАБОЧАЯ ОБЛАСТЬ */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950/60 p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(100vh-65px)]">
          {activeTab === 'theory' && (
            <div className="space-y-5">
              {/* Навигация по 3 главам внутри лекции */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                {[
                  { id: 'metric', title: 'А. Метрика объёма' },
                  { id: 'photon', title: 'Б. Фотонная сфера' },
                  { id: 'isco', title: 'В. Граница ISCO' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setTheoryChapter(ch.id as TheoryChapter)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                      theoryChapter === ch.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>

              {/* Переключатель Школа / Вуз */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Глубина формул:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAudience('school')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'school'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    10–11 класс
                  </button>
                  <button
                    onClick={() => setAudience('university')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'university'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Вуз (ОТО)
                  </button>
                </div>
              </div>

              {/* ГЛАВА А: ОБЪЁМНАЯ МЕТРИКА */}
              {theoryChapter === 'metric' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-100">
                    Почему «резиновый лист» обманывает интуицию?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {audience === 'school'
                      ? 'В космосе нет направления «вниз», куда мог бы прогнуться резиновый батут. Чёрная дыра сжимает трёхмерную координатную сетку со всех сторон к своему центру одинаково. Из-за этого реальный путь с рулеткой к горизонту оказывается длиннее, чем кажется по длине окружности.'
                      : 'Метрика Шварцшильда описывает вакуумное сферически-симметричное гравитационное поле. Коэффициент g_rr = (1 - r_s/r)⁻¹ устремляется в бесконечность при r → r_s, означая собственное радиальное растяжение пространственных интервалов.'}
                  </p>

                  {/* Интерактивный рентген формулы */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-400 block">
                      Рентген интервала Шварцшильда (кликните на слагаемое)
                    </span>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setHighlightedTerm('ds')}
                        className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                      >
                        ds²
                      </button>
                      <span>=</span>
                      <button
                        onClick={() => setHighlightedTerm('dt')}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      >
                        -(1 - r_s/r)c²dt²
                      </button>
                      <span>+</span>
                      <button
                        onClick={() => setHighlightedTerm('dr')}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      >
                        (1 - r_s/r)⁻¹dr²
                      </button>
                      <span>+</span>
                      <button
                        onClick={() => setHighlightedTerm('domega')}
                        className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      >
                        r²dΩ²
                      </button>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {highlightedTerm === 'dt' &&
                        'Замедление времени (g_tt): на горизонте r = r_s скобка обращается в 0 — координатное время замирает.'}
                      {highlightedTerm === 'dr' &&
                        `Радиальная кривизна (g_rr): растягивает сетку и добавляет +${extraDistanceRs} r_s лишнего пути к горизонту.`}
                      {highlightedTerm === 'domega' &&
                        'Угловая метрика сферы: показывает, что площадь сферы 4πr² определяется координатой r.'}
                      {(!highlightedTerm || highlightedTerm === 'ds') &&
                        'Нажмите на цветные блоки формулы выше, чтобы увидеть их физический смысл в 3D-сцене.'}
                    </div>
                  </div>
                </div>
              )}

              {/* ГЛАВА Б: ФОТОННАЯ СФЕРА И ТЕНЬ ЧД */}
              {theoryChapter === 'photon' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-sky-300">
                    Фотонная сфера (1.5 r_s) и критический захват света
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Хотя у фотонов нет массы покоя, они движутся по геодезическим искривлённого
                    объёма. На радиусе ровно в полтора раза больше горизонта событий (
                    <strong className="text-sky-300">R_ph = 1.5 r_s = 3GM/c²</strong>) гравитация
                    настолько сильна, что луч света закручивается в замкнутую круговую орбиту!
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-amber-300">
                      Почему тень чёрной дыры на снимках EHT в 2.6 раза шире самого горизонта?
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Луч, летящий издалека на высоте прицельного параметра{' '}
                      <code className="text-yellow-300">b</code>, испытывает сильное линзирование.
                      Критический рубеж равен{' '}
                      <strong className="text-yellow-300">
                        b_crit = (3√3 / 2) r_s ≈ 2.60 r_s
                      </strong>
                      :
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>
                        Если <strong className="text-emerald-300">b &gt; 2.6 r_s</strong>: луч
                        изгибается, но уходит дальше в космос.
                      </li>
                      <li>
                        Если <strong className="text-sky-300">b ≈ 2.6 r_s</strong>: луч по спирали
                        наматывается на фотонную сферу <code className="text-sky-300">1.5 r_s</code>.
                      </li>
                      <li>
                        Если <strong className="text-rose-400">b &lt; 2.6 r_s</strong>: луч неизбежно
                        падает за горизонт событий, формируя видимую «тень» чёрной дыры!
                      </li>
                    </ul>

                    {/* Интерактивный тестер луча прямо в главе */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">Прицельный параметр луча (b):</span>
                        <span className="text-yellow-300 font-bold">
                          {impactParamB.toFixed(2)} r_s (крит: {bCritValue} r_s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="4.5"
                        step="0.05"
                        value={impactParamB}
                        onChange={(e) => setImpactParamB(parseFloat(e.target.value))}
                        className="w-full accent-yellow-400 cursor-pointer"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setImpactParamB(Number((1.8 * mass).toFixed(2)))}
                          className="flex-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium"
                        >
                          Захват (b &lt; 2.6)
                        </button>
                        <button
                          onClick={() => setImpactParamB(Number((2.6 * mass).toFixed(2)))}
                          className="flex-1 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-medium"
                        >
                          Намотка (b = 2.6)
                        </button>
                        <button
                          onClick={() => setImpactParamB(Number((3.8 * mass).toFixed(2)))}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                        >
                          Пролёт (b &gt; 2.6)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ГЛАВА В: ГРАНИЦА ISCO (3.0 r_s) */}
              {theoryChapter === 'isco' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-amber-300">
                    Граница ISCO (3.0 r_s) — обрыв устойчивых орбит
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    В ньютоновской механике спутник может стабильно вращаться на любом расстоянии от
                    центра, если наберёт нужную скорость. В общей теории относительности появляется
                    дополнительное релятивистское притяжение{' '}
                    <code className="text-amber-300">-r_s · L² / r³</code>, которое уничтожает
                    минимум эффективного потенциала ближе трёх радиусов Шварцшильда!
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-amber-300">
                      R_ISCO = 3.0 r_s = 6GM/c² (Innermost Stable Circular Orbit)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Именно на <strong className="text-amber-300">3.0 r_s</strong> обрывается
                      внутренний край аккреционного диска невращающейся чёрной дыры. Любое тело,
                      пересекшее жёлтое пунктирное кольцо ISCO, без включения двигателей срывается в
                      быструю спираль падения к горизонту.
                    </p>

                    {/* Интерактивный запуск спутника */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">Орбита пробного спутника:</span>
                        <span
                          className={
                            probeRadius < 3.0 * mass
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          R = {probeRadius.toFixed(2)} r_s (ISCO = {iscoValue} r_s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.6"
                        max="5.0"
                        step="0.1"
                        value={probeRadius}
                        onChange={(e) => launchProbeAtRadius(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => launchProbeAtRadius(Number((4.0 * mass).toFixed(1)))}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                        >
                          Стабильная (4.0 r_s)
                        </button>
                        <button
                          onClick={() => launchProbeAtRadius(Number((3.0 * mass).toFixed(1)))}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium"
                        >
                          На кромке ISCO (3.0 r_s)
                        </button>
                        <button
                          onClick={() => launchProbeAtRadius(Number((2.4 * mass).toFixed(1)))}
                          className="flex-1 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium"
                        >
                          Срыв внутрь (2.4 r_s)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 2: ПЕСОЧНИЦА */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Масса */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Масса чёрной дыры (M)</span>
                  <span className="font-mono font-bold text-sky-400">
                    {(mass * 100).toFixed(0)}% ({mass.toFixed(2)} r_s)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.4"
                  step="0.05"
                  value={mass}
                  onChange={(e) => {
                    setFlatComparison(false);
                    setMass(parseFloat(e.target.value));
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <button
                  onClick={animateGravityFromZero}
                  className="w-full py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Включить гравитацию с нуля</span>
                </button>
              </div>

              {/* Лазерный прицел b */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    Прицельный параметр фотона (b)
                  </span>
                  <span className="font-mono text-yellow-300">{impactParamB.toFixed(2)} r_s</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="4.5"
                  step="0.05"
                  value={impactParamB}
                  onChange={(e) => setImpactParamB(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
              </div>

              {/* Орбитальный зонд ISCO */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    Радиус орбиты спутника (R)
                  </span>
                  <span className="font-mono text-emerald-300">{probeRadius.toFixed(2)} r_s</span>
                </div>
                <input
                  type="range"
                  min="1.6"
                  max="5.0"
                  step="0.1"
                  value={probeRadius}
                  onChange={(e) => launchProbeAtRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Чекбоксы слоёв */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                {[
                  { label: 'Горизонт событий (1.0 r_s)', checked: showHorizon, setter: setShowHorizon },
                  {
                    label: 'Фотонная сфера (1.5 r_s) и ISCO (3.0 r_s)',
                    checked: showPhotonSphere,
                    setter: setShowPhotonSphere,
                  },
                  { label: 'Траектория лазерного луча', checked: showLightRays, setter: setShowLightRays },
                  {
                    label: 'Три центральные плоскости (XY, XZ, YZ)',
                    checked: showCentralPlanes,
                    setter: setShowCentralPlanes,
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="accent-sky-500 w-4 h-4 rounded"
                    />
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFlatComparison(!flatComparison)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{flatComparison ? 'Вернуть кривизну' : 'Плоская сетка'}</span>
                </button>
                <button
                  onClick={spawnDustCloud}
                  className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Облако пыли</span>
                </button>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: ЗАДАЧИ */}
          {activeTab === 'tasks' && (
            <div className="space-y-5">
              {/* Задача 1 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Задача 1 · Фотонная сфера и Тень ЧД
                  </span>
                  <button
                    onClick={() => setShowHint1(!showHint1)}
                    className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Подсказка</span>
                  </button>
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  При каком прицельном параметре b параллельный луч света наматывается на фотонную сферу (1.5 r_s)?
                </h3>
                {showHint1 && (
                  <p className="text-xs text-sky-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    Из-за гравитационного фокусирования эффективный радиус захвата в √27 / 2 ≈ 2.6 раза больше радиуса Шварцшильда.
                  </p>
                )}
                <div className="space-y-2">
                  {[
                    { id: 'a', label: 'b = 1.5 r_s (ровно по радиусу сферы)', correct: false },
                    { id: 'b', label: 'b ≈ 2.6 r_s (критический параметр захвата)', correct: true },
                    { id: 'c', label: 'b = 3.0 r_s (на границе ISCO)', correct: false },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTask1Answer(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex justify-between items-center ${
                        task1Answer === opt.id
                          ? opt.correct
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {task1Answer === opt.id &&
                        (opt.correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        ))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Задача 2 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Задача 2 · Посадка зонда на кромку ISCO
                  </span>
                  <button
                    onClick={() => setShowHint2(!showHint2)}
                    className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Формула</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Выведите зелёный орбитальный спутник точно на минимальную устойчивую круговую орбиту{' '}
                  <strong className="text-amber-300">R_ISCO = 3.0 · M</strong> для текущей массы чёрной дыры (сейчас ISCO ={' '}
                  <strong className="text-amber-300">{iscoValue} r_s</strong>).
                </p>
                {showHint2 && (
                  <p className="text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                    Совместите зелёную орбиту спутника с жёлтым пунктирным кольцом ISCO в 3D-окне.
                  </p>
                )}
                <input
                  type="range"
                  min="1.6"
                  max="5.0"
                  step="0.1"
                  value={probeRadius}
                  onChange={(e) => launchProbeAtRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    isTask2Solved
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {isTask2Solved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Зонд выведен ровно на границу ISCO ({iscoValue} r_s)!</span>
                    </>
                  ) : (
                    <span>Текущий радиус зонда: {probeRadius.toFixed(2)} r_s (цель: {iscoValue} r_s)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: 3D-СЦЕНА */}
        <div className="lg:col-span-7 relative bg-slate-950 min-h-[460px] flex flex-col">
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono">
              <span className="text-sky-300">● Фотонная сфера (1.5 r_s)</span>
              <span className="text-amber-300">--- ISCO (3.0 r_s)</span>
              <span className="text-emerald-400">● Зонд ({probeRadius.toFixed(1)} r_s)</span>
              <span className="text-yellow-300">━ Луч (b = {impactParamB.toFixed(2)})</span>
            </div>
          </div>

          <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
        </div>
      </main>
    </div>
  );
}