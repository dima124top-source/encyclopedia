// src/components/sandboxes/SchwarzschildLab.tsx
import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Sliders,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sigma,
  Eye,
  Play,
  Sparkles,
  Zap,
  Compass,
} from 'lucide-react';
import SchwarzschildScene3D from './SchwarzschildScene3D';
import {
  SCHWARZSCHILD_CHAPTERS,
  SCHWARZSCHILD_FORMULA_PARTS,
  SCHWARZSCHILD_QUIZ_TASKS,
  type TheoryChapterId,
  type AudienceLevel,
  type FormulaPartId,
} from '../../data/topics/schwarzschildContent';

interface SchwarzschildLabProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';

export default function SchwarzschildLab({ onBack }: SchwarzschildLabProps) {
  // Навигация по вкладкам и теории
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [chapter, setChapter] = useState<TheoryChapterId>('metric');
  const [audience, setAudience] = useState<AudienceLevel>('university');
  const [selectedPart, setSelectedPart] = useState<FormulaPartId>('g_tt');

  // Параметры первой 3D-симуляции
  const [mass, setMass] = useState<number>(1.0);
  const [halfWidth, setHalfWidth] = useState<number>(6.0);
  const [impactB, setImpactB] = useState<number>(2.6);
  const [probeRadius, setProbeRadius] = useState<number>(3.5);
  const [showHorizon, setShowHorizon] = useState<boolean>(true);
  const [showPhotonSphere, setShowPhotonSphere] = useState<boolean>(true);
  const [showLightRays, setShowLightRays] = useState<boolean>(true);
  const [showCentralPlanes, setShowCentralPlanes] = useState<boolean>(false);
  const [flatComparison, setFlatComparison] = useState<boolean>(false);
  const [dustTrigger, setDustTrigger] = useState<number>(0);

  // Состояние ответов в практикуме
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  // Плавное включение гравитации с нуля (из первого кода)
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

  // Расчётные коэффициенты метрики
  const g_tt = -(1 - 1 / Math.max(1.02, probeRadius));
  const g_rr = 1 / Math.max(0.02, 1 - 1 / Math.max(1.02, probeRadius));
  const extraDistanceRs = (mass * 1.94).toFixed(2);
  const extraPercent = Math.round(mass * 46);
  const sgrAMillionKm = (mass * 38.1).toFixed(1);

  const currentChapter = SCHWARZSCHILD_CHAPTERS[chapter];
  const currentFormulaPart =
    SCHWARZSCHILD_FORMULA_PARTS.find((p) => p.id === selectedPart) ||
    SCHWARZSCHILD_FORMULA_PARTS[0];

  // Проверка Задачи 3 (без явных подсказок)
  const isTask3Solved =
    Math.abs(impactB - 2.6) <= 0.08 && Math.abs(probeRadius - 3.0) <= 0.1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>К каталогу лекций</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                Лекция 01 · Статическое решение ОТО
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

        {/* Переключатель вкладок */}
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
            <span>1. Теория и вывод формул</span>
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
            <span>2. 3D-Песочница</span>
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
            <span>3. Практикум (3 задачи)</span>
          </button>
        </div>
      </header>

      {/* РАБОЧАЯ ОБЛАСТЬ */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА (5 колонок) */}
        <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* ВКЛАДКА 1: ТЕОРИЯ */}
          {activeTab === 'theory' && (
            <div className="space-y-5">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(SCHWARZSCHILD_CHAPTERS).map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setChapter(ch.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-center ${
                        chapter === ch.id
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800/60'
                      }`}
                    >
                      {ch.buttonLabel}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Уровень изложения:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setAudience('school')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        audience === 'school'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      10–11 класс
                    </button>
                    <button
                      onClick={() => setAudience('university')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        audience === 'university'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Вуз (Строгий вывод ОТО)
                    </button>
                  </div>
                </div>
              </div>

              {/* ИНТЕРАКТИВНЫЙ РЕНТГЕН ФОРМУЛЫ МЕТРИКИ */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5 font-semibold">
                    <Sigma className="w-4 h-4" />
                    Рентген метрики Шварцшильда
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {audience === 'school' ? '10–11 класс' : 'Вуз (ОТО)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs sm:text-sm">
                  {SCHWARZSCHILD_FORMULA_PARTS.map((part, idx) => (
                    <React.Fragment key={part.id}>
                      {idx === 1 && <span className="text-slate-500">=</span>}
                      {(idx === 2 || idx === 3) && <span className="text-slate-500">+</span>}
                      {idx === 4 && <span className="text-slate-600 mx-1">|</span>}
                      <button
                        onClick={() => setSelectedPart(part.id)}
                        className={`px-2 py-1 rounded-lg border transition-all ${
                          selectedPart === part.id
                            ? part.activeClass
                            : `border-transparent ${part.colorClass} hover:bg-slate-900`
                        }`}
                      >
                        {part.label}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-mono font-bold text-sky-300">
                    {currentFormulaPart.title[audience]}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {currentFormulaPart.description[audience]}
                  </p>
                </div>
              </div>

              {/* ТЕКСТ И ПОШАГОВЫЙ ВЫВОД ВЫБРАННОЙ ГЛАВЫ */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-100">
                  {currentChapter.heading[audience]}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentChapter.intro[audience]}
                </p>

                <div className="space-y-3">
                  {currentChapter.steps[audience].map((step, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs sm:text-sm"
                    >
                      <div className="font-mono font-semibold text-sky-300">
                        {step.title}
                      </div>
                      {step.formula && (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-amber-300 text-xs overflow-x-auto">
                          {step.formula}
                        </div>
                      )}
                      <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: УПРАВЛЕНИЕ 3D-ПЕСОЧНИЦЕЙ (ИЗ ПЕРВОГО ВАРИАНТА) */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Живое табло метрики */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold block">
                  Живая подстановка в метрику на орбите R = {probeRadius.toFixed(2)} r_s
                </span>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
                  ds² = (<span className="text-amber-300 font-bold">{g_tt.toFixed(2)}</span>)c²dt² + (
                  <span className="text-sky-300 font-bold">+{g_rr.toFixed(2)}</span>)dr² + r²dΩ²
                </div>
              </div>

              {/* Масса в центре */}
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
                  max="1.5"
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

              {/* Половина ширины куба (масштаб из первого кода) */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Половина ширины куба</span>
                  <span className="font-mono text-amber-300">{halfWidth} r_s</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.5"
                  value={halfWidth}
                  onChange={(e) => setHalfWidth(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Прицельный параметр фотона b */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    Прицельный параметр фотона (b)
                  </span>
                  <span className="font-mono text-yellow-300">{impactB.toFixed(2)} r_s</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="4.5"
                  step="0.05"
                  value={impactB}
                  onChange={(e) => setImpactB(parseFloat(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
              </div>

              {/* Радиус орбиты спутника R */}
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
                  step="0.05"
                  value={probeRadius}
                  onChange={(e) => setProbeRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Чекбоксы слоёв из первого варианта */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                {[
                  { label: 'Горизонт событий (1.0 r_s)', checked: showHorizon, setter: setShowHorizon },
                  {
                    label: 'Фотонная сфера (1.5 r_s) и ISCO (3.0 r_s)',
                    checked: showPhotonSphere,
                    setter: setShowPhotonSphere,
                  },
                  { label: 'Лучи света (геодезические)', checked: showLightRays, setter: setShowLightRays },
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

              {/* Кнопки Плоская сетка и Облако пыли */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFlatComparison(!flatComparison)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{flatComparison ? 'Вернуть кривизну' : 'Плоская сетка'}</span>
                </button>
                <button
                  onClick={() => setDustTrigger((prev) => prev + 1)}
                  className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Облако пыли</span>
                </button>
              </div>

              {/* Телеметрия Стрельца A* */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-slate-500 uppercase">
                  Телеметрия метрики (Стрелец A*)
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Масштаб куба для Sgr A*:</span>
                  <span className="text-sky-400 font-bold">{sgrAMillionKm} млн км</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Лишнее расстояние до горизонта:</span>
                  <span className="text-emerald-400 font-bold">
                    +{extraDistanceRs} r_s ({extraPercent}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: ПРАКТИКУМ */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {SCHWARZSCHILD_QUIZ_TASKS.map((task) => {
                const selectedOpt = quizAnswers[task.id];
                const isHintOpen = !!openHints[task.id];
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {task.badge}
                      </span>
                      <button
                        onClick={() =>
                          setOpenHints((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                        }
                        className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Подсказка</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{task.question}</p>

                    {isHintOpen && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300">
                        {task.hint}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {task.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [task.id]: opt.id }))
                          }
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium flex justify-between items-center ${
                            selectedOpt === opt.id
                              ? opt.correct
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                                : 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {selectedOpt === opt.id &&
                            (opt.correct ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            ))}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Задача 3: Исследовательский 3D-эксперимент без явных подсказок */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Задача 3 · 3D-эксперимент: Критические рубежи Шварцшильда
                </span>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Используя 3D-сцену справа и формулы из теоретического раздела, настройте оба ползунка одновременно так, чтобы:
                  <br />
                  1) Луч лазера шёл <strong>ровно по границе тени чёрной дыры</strong> (касаясь фотонной сферы на критическом прицельном параметре).
                  <br />
                  2) Орбитальный зонд находился <strong>строго на пограничном радиусе последней устойчивой круговой орбиты (ISCO)</strong>.
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>Прицельный параметр луча b:</span>
                      <span className="text-yellow-300">{impactB.toFixed(2)} r_s</span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="4.5"
                      step="0.05"
                      value={impactB}
                      onChange={(e) => setImpactB(parseFloat(e.target.value))}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>Радиус орбиты спутника R:</span>
                      <span className="text-emerald-400">{probeRadius.toFixed(2)} r_s</span>
                    </div>
                    <input
                      type="range"
                      min="1.6"
                      max="5.0"
                      step="0.05"
                      value={probeRadius}
                      onChange={(e) => setProbeRadius(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    isTask3Solved
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {isTask3Solved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Задача решена! Вы самостоятельно нашли оба фундаментальных предела метрики Шварцшильда.
                      </span>
                    </>
                  ) : (
                    <span>Наблюдайте за поведением луча и траекторией спутника в 3D-окне справа.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА (7 колонок): 3D-СЦЕНА ИЗ ПЕРВОГО ВАРИАНТА */}
        <div className="lg:col-span-7 relative bg-slate-950 min-h-[460px] flex flex-col">
          <SchwarzschildScene3D
            mass={mass}
            halfWidth={halfWidth}
            impactB={impactB}
            probeRadius={probeRadius}
            showHorizon={showHorizon}
            showPhotonSphere={showPhotonSphere}
            showLightRays={showLightRays}
            showCentralPlanes={showCentralPlanes}
            flatComparison={flatComparison}
            dustTrigger={dustTrigger}
            onAnimateGravityFromZero={animateGravityFromZero}
            onSpawnDust={() => setDustTrigger((prev) => prev + 1)}
          />
        </div>
      </main>
    </div>
  );
}