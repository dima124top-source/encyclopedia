import React, { useState } from 'react';
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
  Zap,
  RefreshCw,
} from 'lucide-react';

import KerrJetsScene3D, {
  getHorizonRadius,
  getProgradeISCO,
  getRetrogradeISCO,
  type OrbitDirection,
} from './KerrJetsScene3D';
import {
  LECTURE_HEADER,
  CHAPTER_TABS,
  AUDIENCE_LABELS,
  PRESET_LABELS,
  ERGOSPHERE_TITLE,
  getErgosphereIntro,
  ERGOSPHERE_CARD_HEADING,
  getErgosphereCardParagraphs,
  ISCO_TITLE,
  ISCO_INTRO,
  ISCO_SWITCH_HINT,
  ISCO_OPTIONS,
  getIscoExplanation,
  JETS_TITLE,
  getJetsIntro,
  FORMULA_XRAY_CAPTION,
  FORMULA_BUTTONS,
  FORMULA_PLACEHOLDER,
  getFormulaExplanation,
  TASK1,
  TASK2,
  type AudienceLevel,
  type FormulaTerm,
  type KerrChapter,
  type LectureValues,
  type RichParagraph,
} from '../../data/topics//KerrJetsLectureText';

interface KerrJetsLabPageProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';
type PresetId = 'schwarzschild' | 'm87_quasar' | 'retrograde_trap';

// ---------------------------------------------------------------------------
// Отрисовка RichSegment (из текстового модуля) в JSX
// ---------------------------------------------------------------------------

const TONE_CLASS = {
  sky: 'text-sky-300',
  amber: 'text-amber-300',
  emerald: 'text-emerald-300',
} as const;

function RichText({ paragraph }: { paragraph: RichParagraph }) {
  return (
    <>
      {paragraph.map((seg, i) => {
        if (typeof seg === 'string') return <React.Fragment key={i}>{seg}</React.Fragment>;
        const cls = seg.tone ? TONE_CLASS[seg.tone] : undefined;
        if (seg.kind === 'code')
          return (
            <code key={i} className={cls}>
              {seg.text}
            </code>
          );
        if (seg.kind === 'strong')
          return (
            <strong key={i} className={cls}>
              {seg.text}
            </strong>
          );
        return (
          <em key={i} className={cls}>
            {seg.text}
          </em>
        );
      })}
    </>
  );
}

export default function KerrJetsLabPage({ onBack }: KerrJetsLabPageProps) {
  // Навигация внутри лекции
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [chapter, setChapter] = useState<KerrChapter>('ergosphere');
  const [audience, setAudience] = useState<AudienceLevel>('university');
  const [highlightedTerm, setHighlightedTerm] = useState<FormulaTerm | null>(null);

  // Физические параметры 3D-песочницы
  const [spinA, setSpinA] = useState<number>(0.9); // Спин Керра a* от 0.00 до 0.99
  const [magneticFieldB, setMagneticFieldB] = useState<number>(0.85); // Магнитное поле B (0 - 1)
  const [orbitDirection, setOrbitDirection] = useState<OrbitDirection>('prograde');
  const [madState, setMadState] = useState<boolean>(false); // Magnetically Arrested Disk (MAD)
  const [showErgosphere, setShowErgosphere] = useState<boolean>(true);
  const [showAccretionDisk, setShowAccretionDisk] = useState<boolean>(true);
  const [showMagneticHelix, setShowMagneticHelix] = useState<boolean>(true);
  const [showFrameDraggingGrid, setShowFrameDraggingGrid] = useState<boolean>(true);

  // Состояние практикума
  const [task1Answer, setTask1Answer] = useState<string | null>(null);
  const [showHint1, setShowHint1] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);

  // Аналитические расчёты метрики Керра (в единицах r_s = 2GM/c^2)
  const rPlusVal = getHorizonRadius(spinA);
  const progradeISCOVal = getProgradeISCO(spinA);
  const retrogradeISCOVal = getRetrogradeISCO(spinA);
  const activeISCOVal = orbitDirection === 'prograde' ? progradeISCOVal : retrogradeISCOVal;

  // Мощность релятивистского джета Блэндфорда — Знаека: P_BZ ~ a*^2 * B^2 * (MAD boost)
  const madBoost = madState ? 1.25 : 1.0;
  const jetPowerVal = Math.min(
    100,
    Math.round(spinA * spinA * magneticFieldB * magneticFieldB * 100 * madBoost)
  );

  // Максимальный КПД процесса Пенроуза и радиационный КПД аккреции
  const penroseEfficiency = (spinA * 20.7).toFixed(1);
  const accretionEfficiency =
    orbitDirection === 'prograde'
      ? (5.7 + Math.pow(spinA, 1.4) * 36.3).toFixed(1)
      : (5.7 - spinA * 2.1).toFixed(1);

  // Значения, подставляемые в тексты лекции
  const lectureValues: LectureValues = {
    spinA,
    rPlus: rPlusVal,
    progradeISCO: progradeISCOVal,
    retrogradeISCO: retrogradeISCOVal,
    activeISCO: activeISCOVal,
    penroseEfficiency,
    accretionEfficiency,
    jetPower: jetPowerVal,
  };

  // Пресеты быстрых экспериментов
  const applyPreset = (preset: PresetId) => {
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

  // Условие Задачи 2
  const isTask2Solved = activeISCOVal <= TASK2.maxISCO && jetPowerVal >= TASK2.minJetPower;

  const tabButtonClass = (tab: ActiveTab, activeClass: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      activeTab === tab ? activeClass : 'text-slate-400 hover:text-slate-200'
    }`;

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
            <span>{LECTURE_HEADER.backLabel}</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                {LECTURE_HEADER.eyebrow}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {LECTURE_HEADER.badge}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              {LECTURE_HEADER.title}
            </h1>
          </div>
        </div>

        {/* Переключатель 3 шагов урока */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('theory')}
            className={tabButtonClass('theory', 'bg-indigo-500 text-white font-semibold shadow-sm')}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.theory}</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={tabButtonClass('controls', 'bg-indigo-500 text-white font-semibold shadow-sm')}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.controls}</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={tabButtonClass('tasks', 'bg-amber-400 text-slate-950 font-semibold shadow-sm')}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.tasks}</span>
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
                {CHAPTER_TABS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChapter(ch.id)}
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
                <span className="text-xs text-slate-400">{AUDIENCE_LABELS.caption}</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAudience('school')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'school'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {AUDIENCE_LABELS.school}
                  </button>
                  <button
                    onClick={() => setAudience('university')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'university'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {AUDIENCE_LABELS.university}
                  </button>
                </div>
              </div>

              {/* ГЛАВА А: ЭРГОСФЕРА КЕРРА И УВЛЕЧЕНИЕ ПРОСТРАНСТВА */}
              {chapter === 'ergosphere' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-indigo-300">{ERGOSPHERE_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {getErgosphereIntro(audience)}
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="font-mono text-indigo-300 font-semibold">
                      {ERGOSPHERE_CARD_HEADING}
                    </div>
                    {getErgosphereCardParagraphs(lectureValues).map((p, i) => (
                      <p key={i}>
                        <RichText paragraph={p} />
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* ГЛАВА Б: СДВИГ ГРАНИЦЫ ISCO */}
              {chapter === 'isco_shift' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-amber-300">{ISCO_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <RichText paragraph={ISCO_INTRO} />
                  </p>

                  {/* Интерактивный переключатель направления орбиты прямо в теории */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-slate-400">{ISCO_SWITCH_HINT}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrbitDirection('prograde')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          orbitDirection === 'prograde'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold mb-0.5">{ISCO_OPTIONS.prograde.title}</div>
                        <div className="font-mono text-[11px]">
                          {ISCO_OPTIONS.prograde.detail(lectureValues)}
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
                        <div className="font-bold mb-0.5">{ISCO_OPTIONS.retrograde.title}</div>
                        <div className="font-mono text-[11px]">
                          {ISCO_OPTIONS.retrograde.detail(lectureValues)}
                        </div>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      <RichText paragraph={getIscoExplanation(lectureValues)} />
                    </p>
                  </div>
                </div>
              )}

              {/* ГЛАВА В: ФИЗИКА РЕЛЯТИВИСТСКИХ ДЖЕТОВ */}
              {chapter === 'jets' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-sky-300">{JETS_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{getJetsIntro(audience)}</p>

                  {/* Интерактивный рентген уравнений Керра и Блэндфорда-Знаека */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-400 block">
                      {FORMULA_XRAY_CAPTION}
                    </span>
                    <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                      {FORMULA_BUTTONS.map((btn) => {
                        const style = {
                          gtphi: {
                            active: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200',
                            idle: 'bg-slate-950 border-slate-800 text-indigo-300 hover:border-slate-700',
                          },
                          ergo: {
                            active: 'bg-amber-500/20 border-amber-500/50 text-amber-200',
                            idle: 'bg-slate-950 border-slate-800 text-amber-300 hover:border-slate-700',
                          },
                          bz_power: {
                            active: 'bg-sky-500/20 border-sky-500/50 text-sky-200',
                            idle: 'bg-slate-950 border-slate-800 text-sky-300 hover:border-slate-700',
                          },
                        }[btn.id];
                        return (
                          <button
                            key={btn.id}
                            onClick={() => setHighlightedTerm(btn.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              highlightedTerm === btn.id ? style.active : style.idle
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      {highlightedTerm
                        ? getFormulaExplanation(highlightedTerm, lectureValues)
                        : FORMULA_PLACEHOLDER}
                    </div>
                  </div>
                </div>
              )}

              {/* Быстрые пресеты экспериментов */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  {PRESET_LABELS.caption}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyPreset('schwarzschild')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium"
                  >
                    {PRESET_LABELS.schwarzschild}
                  </button>
                  <button
                    onClick={() => applyPreset('m87_quasar')}
                    className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] text-sky-300 font-medium"
                  >
                    {PRESET_LABELS.m87_quasar}
                  </button>
                  <button
                    onClick={() => applyPreset('retrograde_trap')}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] text-rose-300 font-medium"
                  >
                    {PRESET_LABELS.retrograde_trap}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: УПРАВЛЕНИЕ 3D-ПЕСОЧНИЦЕЙ */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* ЖИВОЕ ТАБЛО ФОРМУЛ */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Живые уравнения Керра — Знаека
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    a* = {spinA.toFixed(2)} · B = {(magneticFieldB * 100).toFixed(0)}%
                  </span>
                </div>

                {/* 1. Радиус горизонта Керра r_+ */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">
                    1. Сжатие горизонта событий вращением r_+ = ½ r_s · (1 + √(1 - a*²)):
                  </div>
                  <div className="text-slate-200">
                    r_+ = 0.5 · (1 + √(1 - <span className="text-indigo-400">{spinA.toFixed(2)}²</span>
                    )) = <strong className="text-sky-300">{rPlusVal.toFixed(2)} r_s</strong>
                  </div>
                </div>

                {/* 2. Увлечение пространства g_tφ */}
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

                {/* 3. Мощность джета Блэндфорда — Знаека */}
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

              {/* Направление орбиты диска и режим MAD */}
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
                    {TASK1.badge}
                  </span>
                  <button
                    onClick={() => setShowHint1(!showHint1)}
                    className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{TASK1.hintButton}</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{TASK1.question}</h3>

                {showHint1 && (
                  <p className="text-xs text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {TASK1.hint}
                  </p>
                )}

                <div className="space-y-2">
                  {TASK1.options.map((opt) => (
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
                    {TASK2.badge}
                  </span>
                  <button
                    onClick={() => setShowHint2(!showHint2)}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{TASK2.hintButton}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <RichText paragraph={TASK2.statement} />
                </p>

                {showHint2 && (
                  <p className="text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                    {TASK2.hint}
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
                      <span>{TASK2.solvedMessage(lectureValues)}</span>
                    </>
                  ) : (
                    <span>{TASK2.unsolvedMessage(lectureValues)}</span>
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

          <KerrJetsScene3D
            spinA={spinA}
            magneticFieldB={magneticFieldB}
            orbitDirection={orbitDirection}
            madState={madState}
            showErgosphere={showErgosphere}
            showAccretionDisk={showAccretionDisk}
            showMagneticHelix={showMagneticHelix}
            showFrameDraggingGrid={showFrameDraggingGrid}
          />

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
                {PRESET_LABELS.overlaySchwarzschild}
              </button>
              <button
                onClick={() => applyPreset('m87_quasar')}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium"
              >
                {PRESET_LABELS.overlayM87}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}