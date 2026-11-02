import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft,
  BookOpen,
  Sliders,
  Award,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCw,
  Magnet,
  HelpCircle,
  Compass,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface KerrJetsLabProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';
type KerrChapter = 'ergosphere' | 'isco_shift' | 'jets';
type AudienceLevel = 'school' | 'university';
type OrbitDirection = 'prograde' | 'retrograde';
type FormulaTerm = 'gtphi' | 'ergo' | 'bz_power' | null;

export default function KerrJetsLab({ onBack }: KerrJetsLabProps) {
  // Навигация внутри лекции
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [chapter, setChapter] = useState<KerrChapter>('ergosphere');
  const [audience, setAudience] = useState<AudienceLevel>('university');
  const [highlightedTerm, setHighlightedTerm] = useState<FormulaTerm>(null);

  // Физические параметры 3D-песочницы
  const [spinA, setSpinA] = useState<number>(0.9); // Спин Керра a* от 0.00 до 0.99
  const [magneticFieldB, setMagneticFieldB] = useState<number>(0.85); // Магнитное поле B (0 - 1)
  const [orbitDirection, setOrbitDirection] = useState<OrbitDirection>('prograde'); // Попутное / встречное вращение диска
  const [madState, setMadState] = useState<boolean>(false); // Magnetically Arrested Disk (MAD)
  const [showErgosphere, setShowErgosphere] = useState<boolean>(true);
  const [showAccretionDisk, setShowAccretionDisk] = useState<boolean>(true);
  const [showMagneticHelix, setShowMagneticHelix] = useState<boolean>(true);
  const [showFrameDraggingGrid, setShowFrameDraggingGrid] = useState<boolean>(true);

  // Состояние практикума (Задачи)
  const [task1Answer, setTask1Answer] = useState<string | null>(null);
  const [showHint1, setShowHint1] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);

  const mountRef = useRef<HTMLDivElement | null>(null);

  // Ссылки на реактивные состояния для цикла Three.js
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

  // Аналитические расчёты метрики Керра (в единицах r_s = 2GM/c^2)
  // Внешний горизонт событий: r_+ = 0.5 * r_s * (1 + sqrt(1 - a*^2))
  const rPlusVal = 0.5 * (1 + Math.sqrt(Math.max(0.0001, 1 - spinA * spinA)));
  // Предел статичности (внешняя граница эргосферы на экваторе theta = pi/2): r_ergo = 1.0 r_s
  const rErgoEq = 1.0;

  // Радиус ISCO для попутного (prograde) и встречного (retrograde) вращения
  const progradeISCOVal = 3.0 - 2.5 * Math.pow(spinA, 0.82); // Сжимается от 3.0 r_s до 0.5 r_s
  const retrogradeISCOVal = 3.0 + 1.5 * spinA; // Расширяется от 3.0 r_s до 4.5 r_s
  const activeISCOVal = orbitDirection === 'prograde' ? progradeISCOVal : retrogradeISCOVal;

  // Мощность релятивистского джета Блэндфорда — Знаека: P_BZ ~ a*^2 * B^2 * (MAD boost)
  const madBoost = madState ? 1.25 : 1.0;
  const jetPowerVal = Math.min(100, Math.round(spinA * spinA * magneticFieldB * magneticFieldB * 100 * madBoost));

  // Максимальный КПД процесса Пенроуза и радиационный КПД аккреции
  const penroseEfficiency = (spinA * 20.7).toFixed(1);
  const accretionEfficiency =
    orbitDirection === 'prograde'
      ? (5.7 + Math.pow(spinA, 1.4) * 36.3).toFixed(1)
      : (5.7 - spinA * 2.1).toFixed(1);

  // Пресеты быстрых экспериментов
  const applyPreset = (preset: 'schwarzschild' | 'm87_quasar' | 'retrograde_trap') => {
    if (preset === 'schwarzschild') {
      setSpinA(0.0);
      setMagneticFieldB(0.5);
      setOrbitDirection('prograde');
      setMadState(false);
    } else if (preset === 'm87_quasar') {
      setSpinA(0.94);
      setMagneticFieldB(0.95);
      setOrbitDirection('prograde');
      setMadState(true);
    } else if (preset === 'retrograde_trap') {
      setSpinA(0.95);
      setMagneticFieldB(0.4);
      setOrbitDirection('retrograde');
      setMadState(false);
    }
  };

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

    let animId: number;
    let time = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      controls.update();

      const st = stateRef.current;
      time += 0.022;

      // 1. Размер горизонта r_+ уменьшается при росте спина a*
      const currentRPlus = 0.5 * (1 + Math.sqrt(Math.max(0.0001, 1 - st.spinA * st.spinA)));
      horizonMesh.scale.setScalar(currentRPlus);

      // 2. Эргосфера касается горизонта на полюсах (Y = r_+) и расширяется до 1.0 r_s на экваторе
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
      const currentISCO =
        st.orbitDirection === 'prograde'
          ? 3.0 - 2.5 * Math.pow(st.spinA, 0.82)
          : 3.0 + 1.5 * st.spinA;
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
      const colRadius = st.madState ? 0.82 : 1.0; // В режиме MAD магнитное поле сильнее коллимирует джет
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

  // Условие выполнения Задачи 2: сжать радиус ISCO до <= 1.25 r_s и запустить джет мощностью >= 75%
  const isTask2Solved = activeISCOVal <= 1.25 && jetPowerVal >= 75;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ШАПКА ЛЕКЦИИ 02 */}
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                Лекция 02 · Релятивистская астрофизика
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Керр · Эргосфера · Сдвиг ISCO · Джеты
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              Вращение Керра, увлечение пространства и запуск релятивистских джетов
            </h1>
          </div>
        </div>

        {/* Переключатель 3 шагов урока */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory'
                ? 'bg-indigo-500 text-white font-semibold shadow-sm'
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
                ? 'bg-indigo-500 text-white font-semibold shadow-sm'
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
        {/* ЛЕВАЯ КОЛОНКА (Теория / Контроллеры / Задачи) */}
        <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950/60 p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(100vh-65px)]">
          {/* ВКЛАДКА 1: ТЕОРИЯ */}
          {activeTab === 'theory' && (
            <div className="space-y-5">
              {/* Навигация по 3 главам внутри лекции */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                {[
                  { id: 'ergosphere', title: 'А. Эргосфера Керра' },
                  { id: 'isco_shift', title: 'Б. Сдвиг ISCO' },
                  { id: 'jets', title: 'В. Физика Джетов' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChapter(ch.id as KerrChapter)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                      chapter === ch.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>

              {/* Переключатель уровня: 10–11 класс / Вуз */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Уровень строгости:</span>
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
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Вуз (ОТО / МГД)
                  </button>
                </div>
              </div>

              {/* ГЛАВА А: ЭРГОСФЕРА КЕРРА И УВЛЕЧЕНИЕ ПРОСТРАНСТВА */}
              {chapter === 'ergosphere' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-indigo-300">
                    Что происходит с пространством, когда чёрная дыра вращается?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {audience === 'school'
                      ? 'В реальном космосе все звёзды вращаются, поэтому при сжатии в чёрную дыру они раскручиваются до колоссальных скоростей. Вращающаяся чёрная дыра (метрика Роя Керра, 1963) работает как гигантский миксер в густом мёде: она буквально закручивает само пространство вокруг себя.'
                      : 'В координатах Бойера — Линдквиста вращение с безразмерным спином a* = Jc / (GM²) порождает недиагональную компоненту метрического тензора g_tφ ≠ 0. Пространство и время перестают быть ортогональными — возникает релятивистский эффект Лензе — Тирринга (frame-dragging).'}
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="font-mono text-indigo-300 font-semibold">
                      Предел статичности и Эргосфера (Фиолетовая оболочка в 3D)
                    </div>
                    <p>
                      Вокруг горизонта событий <code className="text-sky-300">r_+ = {rPlusVal.toFixed(2)} r_s</code>{' '}
                      появляется сплюснутая область — <strong>эргосфера</strong> (от греч.{' '}
                      <em>ergon</em> — «работа»).
                    </p>
                    <p>
                      Внутри эргосферы компонента <code className="text-amber-300">g_tt</code> меняет знак:
                      само пространство увлекается быстрее скорости света относительно далёких звёзд. Ни один
                      корабль не может там «зависнуть на месте», но поскольку эргосфера лежит{' '}
                      <strong>снаружи горизонта событий</strong>, из неё можно вылететь обратно, забрав до{' '}
                      <strong className="text-emerald-300">{penroseEfficiency}%</strong> энергии вращения ЧД
                      (<strong>процесс Пенроуза</strong>)!
                    </p>
                  </div>
                </div>
              )}

              {/* ГЛАВА Б: СДВИГ ГРАНИЦЫ ISCO */}
              {chapter === 'isco_shift' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-amber-300">
                    Почему вращение ЧД сдвигает границу устойчивых орбит ISCO?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    В первой лекции мы видели, что у статичной дыры Шварцшильда круговые орбиты обрываются на{' '}
                    <code className="text-amber-300">R_ISCO = 3.0 r_s</code>. В метрике Керра всё зависит от
                    того, в какую сторону вращается аккреционный диск!
                  </p>

                  {/* Интерактивный переключатель направления орбиты прямо в теории */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-slate-400">
                      Переключите направление вращения диска и посмотрите на жёлтое кольцо ISCO в 3D:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrbitDirection('prograde')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          orbitDirection === 'prograde'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold mb-0.5">Попутное (Prograde)</div>
                        <div className="font-mono text-[11px]">
                          ISCO = {progradeISCOVal.toFixed(2)} r_s (до 0.5 r_s)
                        </div>
                      </button>

                      <button
                        onClick={() => setOrbitDirection('retrograde')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          orbitDirection === 'retrograde'
                            ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold mb-0.5">Встречное (Retrograde)</div>
                        <div className="font-mono text-[11px]">
                          ISCO = {retrogradeISCOVal.toFixed(2)} r_s (до 4.5 r_s)
                        </div>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      При попутном вращении водоворот пространства «поддерживает» вещество, позволяя диску
                      подойти вплотную к горизонту (<strong className="text-emerald-300">0.5 r_s</strong>) и
                      высветить в космос до <strong className="text-amber-300">{accretionEfficiency}%</strong>{' '}
                      массы покоя (в 7 раз эффективнее термоядерного синтеза в звёздах!).
                    </p>
                  </div>
                </div>
              )}

              {/* ГЛАВА В: ФИЗИКА РЕЛЯТИВИСТСКИХ ДЖЕТОВ */}
              {chapter === 'jets' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-sky-300">
                    Механизм Блэндфорда — Знаека: как запустить джет из эргосферы?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {audience === 'school'
                      ? 'Ничто не вылетает изнутри самого горизонта событий. Релятивистские джеты рождаются в эргосфере снаружи горизонта! Плазма аккреционного диска приносит магнитное поле, а вращающаяся дыра скручивает магнитные линии в две тугие пружины над северным и южным полюсами, выстреливая плазму со скоростью 99% скорости света.'
                      : 'В бессиловой магнитосфере (force-free magnetosphere) вращающейся ЧД полоидальные силовые линии магнитного поля B, пронизывающие эргосферу, испытывают релятивистское закручивание с угловой скоростью Ω_F ≈ 0.5 Ω_H. Возникает тороидальное магнитное поле B_φ и поток вектора Пойнтинга вдоль оси вращения.'}
                  </p>

                  {/* Интерактивный рентген уравнений Керра и Блэндфорда-Знаека */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-400 block">
                      Интерактивный рентген ключевых соотношений (кликните)
                    </span>
                    <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                      <button
                        onClick={() => setHighlightedTerm('gtphi')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          highlightedTerm === 'gtphi'
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                            : 'bg-slate-950 border-slate-800 text-indigo-300 hover:border-slate-700'
                        }`}
                      >
                        1. Сцепление времени и угла: g_tφ = -(r_s · r · a · sin²θ) / Σ
                      </button>

                      <button
                        onClick={() => setHighlightedTerm('ergo')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          highlightedTerm === 'ergo'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-amber-300 hover:border-slate-700'
                        }`}
                      >
                        2. Горизонт и Эргосфера: r_+ = ½r_s(1 + √(1 - a*²)) ≤ r_ergo(θ)
                      </button>

                      <button
                        onClick={() => setHighlightedTerm('bz_power')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          highlightedTerm === 'bz_power'
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-200'
                            : 'bg-slate-950 border-slate-800 text-sky-300 hover:border-slate-700'
                        }`}
                      >
                        3. Мощность джета (Блэндфорд — Знаек): P_BZ ∝ a*² · B² · r_s² · c
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      {highlightedTerm === 'gtphi' &&
                        'Недиагональный член метрики g_tφ заставляет любую падающую частицу и силовую линию магнитного поля вращаться в сторону спина чёрной дыры.'}
                      {highlightedTerm === 'ergo' &&
                        `При текущем спине a* = ${spinA.toFixed(2)} горизонт сжался до ${rPlusVal.toFixed(2)} r_s, открыв между ${rPlusVal.toFixed(2)} r_s и 1.00 r_s рабочую зону эргосферы.`}
                      {highlightedTerm === 'bz_power' &&
                        `Мощность выброса квадратично зависит от спина a* и поля B. Если a* = 0 (Шварцшильд) или B = 0, джет мгновенно гаснет (сейчас P_BZ = ${jetPowerVal}%).`}
                      {!highlightedTerm &&
                        '👆 Нажмите на любое из трёх соотношений выше, чтобы увидеть его роль в формировании джета.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Быстрые пресеты экспериментов */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Быстрые астрофизические сценарии:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyPreset('schwarzschild')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium"
                  >
                    Статика (a* = 0)
                  </button>
                  <button
                    onClick={() => applyPreset('m87_quasar')}
                    className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] text-sky-300 font-medium"
                  >
                    Квазар M87* (MAD)
                  </button>
                  <button
                    onClick={() => applyPreset('retrograde_trap')}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] text-rose-300 font-medium"
                  >
                    Встречный диск
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: УПРАВЛЕНИЕ 3D-ПЕСОЧНИЦЕЙ */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* ЖИВОЕ ТАБЛО ФОРМУЛ (Метрика Керра, Горизонт r_+ и Мощность джета Блэндфорда — Знаека) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Живые уравнения Керра — Знаека
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    a* = {spinA.toFixed(2)} · B = {(magneticFieldB * 100).toFixed(0)}%
                  </span>
                </div>

                {/* 1. Формула радиуса горизонта Керра r_+ */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">
                    1. Сжатие горизонта событий вращением r_+ = ½ r_s · (1 + √(1 - a*²)):
                  </div>
                  <div className="text-slate-200">
                    r_+ = 0.5 · (1 + √(1 - <span className="text-indigo-400">{spinA.toFixed(2)}²</span>
                    )) = <strong className="text-sky-300">{rPlusVal.toFixed(2)} r_s</strong>
                  </div>
                </div>

                {/* 2. Недиагональная компонента увлечения пространства g_tφ */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">
                    2. Увлечение пространства (член Лензе — Тирринга g_tφ ∝ -a*):
                  </div>
                  <div className="text-indigo-300">
                    g_tφ = -r_s · a* / r ⇒{' '}
                    <strong>
                      {spinA === 0
                        ? '0.00 (Пространство не вращается)'
                        : `-${(spinA * 0.85).toFixed(2)} (Вихрь эргосферы активен)`}
                    </strong>
                  </div>
                </div>

                {/* 3. Формула мощности релятивистского джета Блэндфорда — Знаека */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">
                    3. Мощность магнитного джета P_BZ = k · a*² · B²:
                  </div>
                  <div className="text-slate-200">
                    P_BZ = {madState ? '1.25 (MAD) × ' : '1.00 × '}
                    (<span className="text-indigo-400">{spinA.toFixed(2)}</span>)² × (
                    <span className="text-sky-400">{magneticFieldB.toFixed(2)}</span>)² ={' '}
                    <strong className="text-emerald-400">{jetPowerVal}%</strong>
                  </div>
                </div>
              </div>
              {/* Ползунок 1: Спин Керра a* */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    Спин вращения ЧД (a* = Jc/GM²)
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{spinA.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.01"
                  value={spinA}
                  onChange={(e) => setSpinA(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Ползунок 2: Магнитное поле B */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Magnet className="w-3.5 h-3.5 text-sky-400" />
                    Магнитное поле аккреции (B)
                  </span>
                  <span className="font-mono font-bold text-sky-400">
                    {(magneticFieldB * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={magneticFieldB}
                  onChange={(e) => setMagneticFieldB(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Переключатель направления орбиты диска и режима MAD */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setOrbitDirection(orbitDirection === 'prograde' ? 'retrograde' : 'prograde')
                  }
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-xs font-medium flex items-center justify-center gap-2 text-amber-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{orbitDirection === 'prograde' ? 'Попутный диск' : 'Встречный диск'}</span>
                </button>

                <button
                  onClick={() => setMadState(!madState)}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    madState
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Режим MAD: {madState ? 'ВКЛ' : 'ВЫКЛ'}</span>
                </button>
              </div>

              {/* Чекбоксы слоёв */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                {[
                  {
                    label: 'Оболочка эргосферы Керра',
                    checked: showErgosphere,
                    setter: setShowErgosphere,
                  },
                  {
                    label: 'Вихри увлечения пространства (Frame-Dragging)',
                    checked: showFrameDraggingGrid,
                    setter: setShowFrameDraggingGrid,
                  },
                  {
                    label: 'Аккреционный диск и кольцо ISCO',
                    checked: showAccretionDisk,
                    setter: setShowAccretionDisk,
                  },
                  {
                    label: 'Спирали магнитной башни джета',
                    checked: showMagneticHelix,
                    setter: setShowMagneticHelix,
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
                      className="accent-indigo-500 w-4 h-4 rounded"
                    />
                  </label>
                ))}
              </div>

              {/* Блок телеметрии */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-slate-500 uppercase">
                  Релятивистская телеметрия Керра
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Радиус горизонта событий (r_+):</span>
                  <span className="text-slate-200">{rPlusVal.toFixed(2)} r_s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Текущая граница ISCO:</span>
                  <span className="text-amber-300 font-bold">{activeISCOVal.toFixed(2)} r_s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">КПД излучения диска:</span>
                  <span className="text-emerald-400 font-bold">{accretionEfficiency}% mc²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Мощность джета (P_BZ):</span>
                  <span className="text-sky-400 font-bold">{jetPowerVal}%</span>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: ПРАКТИКУМ (2 ЗАДАЧИ) */}
          {activeTab === 'tasks' && (
            <div className="space-y-5">
              {/* Задача 1 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Задача 1 · Базовая проверка
                  </span>
                  <button
                    onClick={() => setShowHint1(!showHint1)}
                    className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Подсказка</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100">
                  Почему у статичной чёрной дыры Шварцшильда (a* = 0) не работает механизм Блэндфорда — Знаека?
                </h3>

                {showHint1 && (
                  <p className="text-xs text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    Вспомните формулу P_BZ ∝ a*² · B²: без эргосферы и вращения пространства магнитные линии не скручиваются в тороидальную пружину.
                  </p>
                )}

                <div className="space-y-2">
                  {[
                    {
                      id: 'a',
                      label: 'У дыры Шварцшильда нет горизонта событий',
                      correct: false,
                    },
                    {
                      id: 'b',
                      label: 'При a* = 0 исчезает эргосфера и закручивание силовых линий магнитного поля',
                      correct: true,
                    },
                    {
                      id: 'c',
                      label: 'Магнитное поле полностью поглощается центральной сингулярностью',
                      correct: false,
                    },
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
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Задача 2 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Задача 2 · Калибровка квазара M87*
                  </span>
                  <button
                    onClick={() => setShowHint2(!showHint2)}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Условие</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Настройте систему так, чтобы внутренняя граница диска прижалась к горизонту ближе{' '}
                  <strong className="text-amber-300">R_ISCO ≤ 1.25 r_s</strong>, а мощность джета{' '}
                  <strong className="text-sky-300">P_BZ достигла ≥ 75%</strong>.
                </p>

                {showHint2 && (
                  <p className="text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                    Убедитесь, что включено попутное вращение диска (Prograde), поднимите спин a* ≥ 0.75 и магнитное поле B ≥ 0.90.
                  </p>
                )}

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Спин a*: {spinA.toFixed(2)}</span>
                    <span>ISCO: {activeISCOVal.toFixed(2)} r_s</span>
                    <span>P_BZ: {jetPowerVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.99"
                    step="0.01"
                    value={spinA}
                    onChange={(e) => setSpinA(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={magneticFieldB}
                    onChange={(e) => setMagneticFieldB(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

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
                      <span>
                        Режим квазара достигнут! ISCO = {activeISCOVal.toFixed(2)} r_s, мощность джета ={' '}
                        {jetPowerVal}%.
                      </span>
                    </>
                  ) : (
                    <span>
                      Цель: R_ISCO ≤ 1.25 r_s (сейчас {activeISCOVal.toFixed(2)}) и P_BZ ≥ 75% (сейчас{' '}
                      {jetPowerVal}%).
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: 3D-СЦЕНА THREE.JS */}
        <div className="lg:col-span-7 relative bg-slate-950 min-h-[460px] flex flex-col">
          {/* Верхний инфо-оверлей */}
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono">
              <span className="text-indigo-300">● Эргосфера (a* = {spinA.toFixed(2)})</span>
              <span className="text-amber-300">
                --- ISCO ({activeISCOVal.toFixed(2)} r_s ·{' '}
                {orbitDirection === 'prograde' ? 'Попутный' : 'Встречный'})
              </span>
              <span className="text-sky-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Джет ({jetPowerVal}%)
              </span>
            </div>
          </div>

          <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Нижняя быстрая панель поверх 3D */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800">
            <div className="flex items-center gap-4 text-xs font-mono px-2">
              <div>
                <span className="text-slate-500">Горизонт r_+: </span>
                <span className="text-slate-200 font-bold">{rPlusVal.toFixed(2)} r_s</span>
              </div>
              <div>
                <span className="text-slate-500">КПД диска: </span>
                <span className="text-emerald-400 font-bold">{accretionEfficiency}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => applyPreset('schwarzschild')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Выключить спин (a*=0)
              </button>
              <button
                onClick={() => applyPreset('m87_quasar')}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium"
              >
                Запустить джет M87*
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}