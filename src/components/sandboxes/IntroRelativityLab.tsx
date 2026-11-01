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
  HelpCircle,
  Clock,
  Box,
} from 'lucide-react';

interface IntroRelativityLabProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';
type IntroChapter = 'equivalence' | 'lightcones' | 'tensors';
type AudienceLevel = 'school' | 'university';
type TensorRank = 0 | 1 | 2 | 3 | 4;

export default function IntroRelativityLab({ onBack }: IntroRelativityLabProps) {
  // Навигация внутри лекции
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [chapter, setChapter] = useState<IntroChapter>('equivalence');
  const [audience, setAudience] = useState<AudienceLevel>('school');

  // Параметры 3D-песочницы и Тензорного инспектора
  const [gravityStrength, setGravityStrength] = useState<number>(0.75);
  const [selectedRank, setSelectedRank] = useState<TensorRank>(2);
  const [showLightCones, setShowLightCones] = useState<boolean>(true);
  const [showClockWave, setShowClockWave] = useState<boolean>(true);
  const [showFreeFallGeodesic, setShowFreeFallGeodesic] = useState<boolean>(true);

  // Состояние практикума (2 задачи)
  const [task1Answer, setTask1Answer] = useState<string | null>(null);
  const [showHint1, setShowHint1] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    gravityStrength,
    showLightCones,
    showClockWave,
    showFreeFallGeodesic,
  });

  useEffect(() => {
    stateRef.current = {
      gravityStrength,
      showLightCones,
      showClockWave,
      showFreeFallGeodesic,
    };
  }, [gravityStrength, showLightCones, showClockWave, showFreeFallGeodesic]);

  // Вычисляемые компоненты метрики для интерактивной матрицы 4x4
  const g_tt = -(1 - 0.65 * gravityStrength);
  const g_rr = 1 / Math.max(0.15, 1 - 0.65 * gravityStrength);
  const clockRatePercent = Math.round(Math.sqrt(Math.max(0.04, 1 - 0.65 * gravityStrength)) * 100);
  const coneTiltDeg = Math.round(gravityStrength * 42);

  // Инициализация 3D-сцены Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5.5, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    // 1. Оси пространства-времени (X — пространство r, Y — время ct)
    const gridHelper = new THREE.GridHelper(12, 12, 0x334155, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Источник массы слева (на r = -4.8)
    const massColumnGeo = new THREE.CylinderGeometry(0.55, 0.55, 6.5, 32);
    const massColumnMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const massColumn = new THREE.Mesh(massColumnGeo, massColumnMat);
    massColumn.position.set(-4.8, 0.5, 0);
    scene.add(massColumn);

    // 2. Ряд световых конусов вдоль радиуса r
    const conesGroup = new THREE.Group();
    scene.add(conesGroup);

    const conePositionsX = [-3.0, -1.0, 1.0, 3.0, 5.0];
    const lightCones: { group: THREE.Group; xPos: number }[] = [];

    conePositionsX.forEach((xPos) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(xPos, -0.5, 0);

      const futureCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 1.4, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        })
      );
      futureCone.position.y = 0.7;
      cGroup.add(futureCone);

      const pastCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 1.4, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x64748b,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
        })
      );
      pastCone.rotation.z = Math.PI;
      pastCone.position.y = -0.7;
      cGroup.add(pastCone);

      conesGroup.add(cGroup);
      lightCones.push({ group: cGroup, xPos });
    });

    // 3. Волна собственного времени часов (жёлтая линия)
    const clockCount = 50;
    const clockGeo = new THREE.BufferGeometry();
    const clockPositions = new Float32Array(clockCount * 3);
    clockGeo.setAttribute('position', new THREE.BufferAttribute(clockPositions, 3));
    const clockLine = new THREE.Line(
      clockGeo,
      new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 })
    );
    scene.add(clockLine);

    // 4. Мировая линия свободного падения тела (зелёная линия)
    const geoCount = 60;
    const geodesicGeo = new THREE.BufferGeometry();
    const geodesicPositions = new Float32Array(geoCount * 3);
    geodesicGeo.setAttribute('position', new THREE.BufferAttribute(geodesicPositions, 3));
    const geodesicLine = new THREE.Line(
      geodesicGeo,
      new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2 })
    );
    scene.add(geodesicLine);

    // Зелёное яблоко, движущееся вдоль мировой линии
    const appleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    scene.add(appleMesh);

    let animId: number;
    let time = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      controls.update();

      const st = stateRef.current;
      time += 0.018;

      // ЕДИНАЯ ФАЗА ВРЕМЕНИ (от 0 до 1) И ДЛЯ ЯБЛОКА, И ДЛЯ ЖЁЛТОЙ ВОЛНЫ ЧАСОВ
      const cycleTau = (time * 0.35) % 1;
      const totalHeight = 4.8;
      const baseTimeY = -2.0;

      // 1. Наклон световых конусов к источнику массы
      conesGroup.visible = st.showLightCones;
      lightCones.forEach(({ group, xPos }) => {
        const dist = Math.max(1.2, xPos - -4.8);
        const tiltAngle = (st.gravityStrength * 1.15) / Math.pow(dist, 0.85);
        group.rotation.z = Math.min(0.85, tiltAngle);
      });

      // 2. Жёлтая волна времени: поднимается строго синхронно с яблоком справа,
      // а слева у цилиндра массы отстаёт из-за замедления времени g_tt
      clockLine.visible = st.showClockWave;
      const cPos = clockGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < clockCount; i++) {
        const t = i / (clockCount - 1);
        const x = -3.8 + t * 9.2;
        const dist = Math.max(1.05, x - -4.8);

        // Коэффициент течения времени: вдали справа ~ 1.0, у массы слева < 1.0
        const timeDilationFactor = Math.sqrt(
          Math.max(0.12, 1 - (st.gravityStrength * 0.85) / dist)
        );

        // В точке старта яблока (x = 3.8) высота волны совпадает с высотой яблока!
        const y = baseTimeY + cycleTau * totalHeight * timeDilationFactor;
        cPos[i * 3] = x;
        cPos[i * 3 + 1] = y;
        cPos[i * 3 + 2] = 0; // В одной плоскости с яблоком, чтобы не было параллакса
      }
      clockGeo.attributes.position.needsUpdate = true;

      // 3. Мировая линия свободно падающего яблока
      geodesicLine.visible = st.showFreeFallGeodesic;
      appleMesh.visible = st.showFreeFallGeodesic;
      const gPos = geodesicGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < geoCount; i++) {
        const tau = i / (geoCount - 1);
        const xSpace = Math.max(-4.2, 3.8 - st.gravityStrength * 5.2 * tau * tau);
        const dist = Math.max(1.05, xSpace - -4.8);
        const localDilation = Math.sqrt(
          Math.max(0.12, 1 - (st.gravityStrength * 0.85) / dist)
        );
        const yTime = baseTimeY + tau * totalHeight * localDilation;

        gPos[i * 3] = xSpace;
        gPos[i * 3 + 1] = yTime;
        gPos[i * 3 + 2] = 0;
      }
      geodesicGeo.attributes.position.needsUpdate = true;

      // 4. Позиция самого зелёного яблока (лежит точно на пересечении своей траектории и жёлтой волны времени!)
      const appleX = Math.max(-4.2, 3.8 - st.gravityStrength * 5.2 * cycleTau * cycleTau);
      const appleDist = Math.max(1.05, appleX - -4.8);
      const appleDilation = Math.sqrt(
        Math.max(0.12, 1 - (st.gravityStrength * 0.85) / appleDist)
      );
      const appleY = baseTimeY + cycleTau * totalHeight * appleDilation;
      appleMesh.position.set(appleX, appleY, 0);

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

  const isTask2Solved = gravityStrength >= 0.95 && selectedRank === 4;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ВЕРХНЯЯ ШАПКА УРОКА */}
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                Вводная лекция 00 · Фундамент ОТО
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Старт перед Шварцшильдом и Керром
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              Принцип эквивалентности, замедление времени и язык тензоров
            </h1>
          </div>
        </div>

        {/* Переключатель 3 шагов урока */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
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
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Инспектор Тензоров</span>
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
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950/60 p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(100vh-65px)]">
          {/* ВКЛАДКА 1: ТЕОРИЯ */}
          {activeTab === 'theory' && (
            <div className="space-y-5">
              {/* Переключатель 3 глав вводной лекции */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                {[
                  { id: 'equivalence', title: 'А. Лифт Эйнштейна' },
                  { id: 'lightcones', title: 'Б. Световые конусы' },
                  { id: 'tensors', title: 'В. Тензоры (0–4)' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChapter(ch.id as IntroChapter)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                      chapter === ch.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>

              {/* Переключатель уровня: Школа / Вуз */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">Глубина изложения:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAudience('school')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'school'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    10–11 класс (Наглядно)
                  </button>
                  <button
                    onClick={() => setAudience('university')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'university'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Вуз (Индексы и ОТО)
                  </button>
                </div>
              </div>

              {/* ГЛАВА А: ПРИНЦИП ЭКВИВАЛЕНТНОСТИ И ЗАМЕДЛЕНИЕ ВРЕМЕНИ */}
              {chapter === 'equivalence' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-emerald-300">
                    Почему яблоко падает на Землю, если гравитация — это не сила?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {audience === 'school'
                      ? 'В 1907 году Эйнштейн понял свою «самую счастливую мысль»: человек в свободно падающем лифте невесом! Значит, гравитация в одной точке неотличима от ускорения системы отсчёта. Но почему мы вообще чувствуем притяжение к полу, стоя в комнате? Оказывается, всё дело в том, что у наших ног время течёт чуть медленнее, чем на уровне головы!'
                      : 'Согласно принципу эквивалентности, локально в системе свободного падения символы Кристоффеля обнуляются (Γ^λ_μν = 0). В слабом статическом поле ньютоновское ускорение свободного падения возникает исключительно из пространственного градиента временной компоненты метрики: Γ^i_00 ≈ -½ ∂_i g_tt.'}
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="font-mono text-amber-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Закон «поворота» мировой линии к медленным часам
                    </div>
                    <p>
                      В четырёхмерном пространстве-времени любое тело (даже покоящееся на ветке
                      яблоко) несётся вперёд вдоль оси времени со скоростью света <code className="text-sky-300">c</code>.
                    </p>
                    <p>
                      Посмотрите на <strong>жёлтую волну часов</strong> и{' '}
                      <strong className="text-emerald-300">зелёное яблоко</strong> в 3D-сцене
                      справа: яблоко всегда сидит прямо на жёлтой линии фронта времени! Но поскольку слева у массивного цилиндра время отстаёт (сейчас{' '}
                      <strong className="text-amber-300">{clockRatePercent}%</strong> от далекого космоса),
                      наклон фронта времени неизбежно заворачивает траекторию яблока влево к массе!
                    </p>
                  </div>
                </div>
              )}

              {/* ГЛАВА Б: 4D-ИНТЕРВАЛ И НАКЛОН СВЕТОВЫХ КОНУСОВ */}
              {chapter === 'lightcones' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-sky-300">
                    Откуда в формуле интервала минус и почему из чёрной дыры нельзя выйти?
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    В обычной школьной геометрии теорема Пифагора складывает квадраты координат:{' '}
                    <code>dl² = dx² + dy² + dz²</code>. Но в пространстве-времени Минковского и Эйнштейна
                    время и пространство связаны через <strong>знак минус</strong>:
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-center text-sky-300">
                    ds² = -c²dt² + dx² + dy² + dz²
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="font-mono text-sky-300 font-semibold">
                      Наклон световых конусов будущего (Синие конусы в 3D)
                    </div>
                    <p>
                      Для луча света интервал всегда равен нулю (<code>ds² = 0</code>), что рисует в
                      пространстве-времени <strong>световой конус</strong>. Ни один корабль не может
                      выйти за стенки своего конуса будущего.
                    </p>
                    <p>
                      Двигайте ползунок гравитации ниже: масса наклоняет световые конусы к себе (сейчас
                      наклон <strong className="text-sky-300">{coneTiltDeg}°</strong>). Когда на
                      горизонте событий конус наклоняется больше чем на 45°, даже его внешняя стенка
                      смотрит внутрь дыры — поэтому движение наружу означало бы путешествие в прошлое!
                    </p>
                  </div>
                </div>
              )}

              {/* ГЛАВА В: ЯЗЫК ТЕНЗОРОВ (РАНГИ 0-4) */}
              {chapter === 'tensors' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-amber-300">
                    Что такое тензор на пальцах: таблица рангов 0–4
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {audience === 'school'
                      ? 'Слово «тензор» звучит пугающе, но на деле это просто таблица чисел, которая описывает физический объект так, чтобы законы природы не зависели от того, под каким углом мы повернули линейку или оси координат. Ранг тензора — это просто количество индексов (размерность таблицы)!'
                      : 'Тензор типа (p, q) — полилинейное отображение, преобразующееся по линейному закону при произвольной гладкой замене координат (общей ковариантности). В 4-мерном пространстве-времени тензор ранга k содержит 4^k компонент.'}
                  </p>

                  {/* Интерактивный селектор рангов 0-4 */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {([0, 1, 2, 3, 4] as TensorRank[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRank(r)}
                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                          selectedRank === r
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ранг {r}
                      </button>
                    ))}
                  </div>

                  {/* Карточка выбранного ранга */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                    {selectedRank === 0 && (
                      <>
                        <div className="font-mono text-emerald-400 font-bold">
                          Ранг 0 · Скаляр (4⁰ = 1 число) — ds², масса покоя m
                        </div>
                        <p className="text-slate-300">
                          Одиночное число без индексов. Одинаково для всех наблюдателей во Вселенной,
                          с какой бы скоростью они ни летели.
                        </p>
                      </>
                    )}
                    {selectedRank === 1 && (
                      <>
                        <div className="font-mono text-sky-400 font-bold">
                          Ранг 1 · 4-Вектор V^μ и Ковектор V_μ (4¹ = 4 компоненты)
                        </div>
                        <p className="text-slate-300">
                          Столбец из 4 чисел: <code>(V^t, V^r, V^θ, V^φ)</code>. Описывает 4-скорость
                          или 4-импульс частицы в пространстве-времени.
                        </p>
                      </>
                    )}
                    {selectedRank === 2 && (
                      <>
                        <div className="font-mono text-amber-400 font-bold">
                          Ранг 2 · Метрический тензор g_μν и Тензор Эйнштейна G_μν (4² = 16 чисел)
                        </div>
                        <p className="text-slate-300">
                          Квадратная матрица <code>4×4</code>. Задаёт «правило рулетки и часов» в каждой
                          точке: диагональ отвечает за замедление времени и растяжение сетки
                          (Шварцшильд), а боковые ячейки — за вращение воронки (Керр).
                        </p>
                      </>
                    )}
                    {selectedRank === 3 && (
                      <>
                        <div className="font-mono text-indigo-400 font-bold">
                          Ранг 3 · Символы Кристоффеля Γ^λ_μν (4³ = 64 числа)
                        </div>
                        <p className="text-slate-300">
                          Трёхмерный куб коэффициентов связности <code>4×4×4</code>. Показывает кажущуюся
                          «силу притяжения» и силу Кориолиса. В свободно падающем лифте его всегда можно
                          обнулить!
                        </p>
                      </>
                    )}
                    {selectedRank === 4 && (
                      <>
                        <div className="font-mono text-rose-400 font-bold">
                          Ранг 4 · Тензор кривизны Римана R^ρ_σμν и Вейля (4⁴ = 256 чисел)
                        </div>
                        <p className="text-slate-300">
                          Истинная неустранимая кривизна пространства-времени! Отвечает за{' '}
                          <strong>приливные силы (спагеттификацию)</strong>: даже в падающем лифте этот
                          тензор не равен нулю и растягивает облако пыли вдоль радиуса.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Ползунок гравитационного поля прямо под теорией */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Кривизна поля (градиент массы):</span>
                  <span className="text-emerald-400 font-bold">
                    {(gravityStrength * 100).toFixed(0)}% (Ход часов: {clockRatePercent}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={gravityStrength}
                  onChange={(e) => setGravityStrength(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: ИНСПЕКТОР ТЕНЗОРОВ И УРАВНЕНИЯ ЭЙНШТЕЙНА */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Напряжённость поля у массы</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(gravityStrength * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={gravityStrength}
                  onChange={(e) => setGravityStrength(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Живая матрица метрического тензора g_μν 4x4 */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    Живая матрица метрики g_μν (4×4)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {gravityStrength === 0 ? 'Метрика Минковского η_μν' : 'Искривлённая метрика'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 font-mono text-xs text-center">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                    {g_tt.toFixed(2)}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                    +{g_rr.toFixed(2)}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">r²</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-600">0</div>
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
                    r²sin²θ
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  При нулевой массе (<code>0%</code>) матрица превращается в плоскую диагональ Минковского{' '}
                  <code>(-1, +1, r², r²sin²θ)</code>. При росте массы <strong className="text-amber-300">g_tt</strong>{' '}
                  стремится к нулю (замедление времени), а <strong className="text-emerald-300">g_rr</strong>{' '}
                  растёт (растяжение пространства).
                </p>
              </div>

              {/* Слои 3D-сцены */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                {[
                  {
                    label: 'Световые конусы будущего и прошлого',
                    checked: showLightCones,
                    setter: setShowLightCones,
                  },
                  {
                    label: 'Волна замедления собственных часов (g_tt)',
                    checked: showClockWave,
                    setter: setShowClockWave,
                  },
                  {
                    label: 'Геодезическая свободного падения тела',
                    checked: showFreeFallGeodesic,
                    setter: setShowFreeFallGeodesic,
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
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: ПРАКТИКУМ (2 ЗАДАЧИ) */}
          {activeTab === 'tasks' && (
            <div className="space-y-5">
              {/* Задача 1 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Задача 1 · Причина падения тел в ОТО
                  </span>
                  <button
                    onClick={() => setShowHint1(!showHint1)}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Подсказка</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100">
                  Из какой компоненты метрического тензора g_μν возникает привычное нам земное притяжение для медленно движущихся тел?
                </h3>

                {showHint1 && (
                  <p className="text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    Вспомните Главу А: мировая линия тела в пространстве-времени поворачивает туда, где медленнее идут часы (компонента при dt²).
                  </p>
                )}

                <div className="space-y-2">
                  {[
                    {
                      id: 'a',
                      label: 'Из градиента замедления времени (компонента g_tt)',
                      correct: true,
                    },
                    {
                      id: 'b',
                      label: 'Только из магнитного поля Земли',
                      correct: false,
                    },
                    {
                      id: 'c',
                      label: 'Время на всех высотах над Землёй течёт с абсолютно одинаковой скоростью',
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
                    Задача 2 · Детектор истинной кривизны Римана
                  </span>
                  <button
                    onClick={() => setShowHint2(!showHint2)}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Подсказка</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Выберите ранг тензора, который описывает <strong>истинную неустранимую кривизну и приливные силы Римана (256 компонент)</strong>.<br />
                  2. Установите ползунок кривизны поля <strong>≥ 95%</strong>, чтобы наклонить световые конусы к горизонту.
                </p>

                {showHint2 && (
                  <p className="text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                    Тензор кривизны Римана R^ρ_σμν имеет 4 индекса (Ранг 4). Выберите кнопку «Ранг 4» ниже и сдвиньте ползунок вправо.
                  </p>
                )}

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {([0, 1, 2, 3, 4] as TensorRank[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRank(r)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-bold ${
                        selectedRank === r
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Ранг {r}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.05"
                  value={gravityStrength}
                  onChange={(e) => setGravityStrength(parseFloat(e.target.value))}
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
                      <span>
                        Отлично! Выбран тензор Римана (Ранг 4), световые конусы наклонены на {coneTiltDeg}°. Вы готовы к Лекции 01 (Шварцшильд)!
                      </span>
                    </>
                  ) : (
                    <span>
                      Текущий выбор: Ранг {selectedRank}, поле {(gravityStrength * 100).toFixed(0)}% (нужно: Ранг 4 и поле ≥ 95%).
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: 3D-ДИАГРАММА ПРОСТРАНСТВА-ВРЕМЕНИ */}
        <div className="lg:col-span-7 relative bg-slate-950 min-h-[460px] flex flex-col">
          {/* Верхняя легенда осей */}
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono">
              <span className="text-sky-300">▲ Световые конусы (наклон {coneTiltDeg}°)</span>
              <span className="text-amber-300">━ Волна часов ({clockRatePercent}%)</span>
              <span className="text-emerald-400">● Падение яблока во времени</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 font-mono">
              Ось Y ↑ Время (ct) · Ось X → Расстояние (r)
            </div>
          </div>

          <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Нижняя панель быстрых режимов */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800">
            <div className="flex items-center gap-4 text-xs font-mono px-2">
              <div>
                <span className="text-slate-500">g_tt: </span>
                <span className="text-amber-300 font-bold">{g_tt.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500">g_rr: </span>
                <span className="text-emerald-400 font-bold">+{g_rr.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setGravityStrength(0)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Плоский мир Минковского (0%)
              </button>
              <button
                onClick={() => setGravityStrength(1.0)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium"
              >
                Включить гравитацию (100%)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}