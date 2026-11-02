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
  Eye,
} from 'lucide-react';

// 1. ИМПОРТ ИЗОЛИРОВАННОЙ 3D-СЦЕНЫ
import KerrJetsScene3D from './KerrJetsScene3D';

// 2. ИМПОРТ ДАННЫХ И ТЕКСТОВ ЛЕКЦИИ
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
} from './KerrJetsLectureText';

interface KerrJetsLabPageProps {
  onBack: () => void;
}

type ActiveTab = 'theory' | 'controls' | 'tasks';

export default function KerrJetsLabPage({ onBack }: KerrJetsLabPageProps) {
  // Навигация
  const [activeTab, setActiveTab] = useState<ActiveTab>('theory');
  const [chapter, setChapter] = useState<KerrChapter>('ergosphere');
  const [audience, setAudience] = useState<AudienceLevel>('university');
  const [highlightedTerm, setHighlightedTerm] = useState<FormulaTerm>(null);

  // Физические параметры (состояние для 3D и аналитики)
  const [spinA, setSpinA] = useState<number>(0.9);
  const [magneticFieldB, setMagneticFieldB] = useState<number>(0.85);
  const [orbitDirection, setOrbitDirection] = useState<'prograde' | 'retrograde'>('prograde');
  const [madState, setMadState] = useState<boolean>(false);

  // Слои визуализации
  const [showErgosphere, setShowErgosphere] = useState<boolean>(true);
  const [showAccretionDisk, setShowAccretionDisk] = useState<boolean>(true);
  const [showMagneticHelix, setShowMagneticHelix] = useState<boolean>(true);
  const [showFrameDraggingGrid, setShowFrameDraggingGrid] = useState<boolean>(true);

  // Практикум
  const [task1Answer, setTask1Answer] = useState<string | null>(null);
  const [showHint1, setShowHint1] = useState<boolean>(false);
  const [showHint2, setShowHint2] = useState<boolean>(false);

  // Аналитические расчёты метрики Керра
  const rPlusVal = 0.5 * (1 + Math.sqrt(Math.max(0.0001, 1 - spinA * spinA)));
  const rErgoEq = 1.0;
  const progradeISCOVal = 3.0 - 2.5 * Math.pow(spinA, 0.82);
  const retrogradeISCOVal = 3.0 + 1.5 * spinA;
  const activeISCOVal = orbitDirection === 'prograde' ? progradeISCOVal : retrogradeISCOVal;
  
  const madBoost = madState ? 1.25 : 1.0;
  const jetPowerVal = Math.min(100, Math.round(spinA * spinA * magneticFieldB * magneticFieldB * 100 * madBoost));
  const penroseEfficiency = (spinA * 20.7).toFixed(1);
  const accretionEfficiency = orbitDirection === 'prograde'
      ? (5.7 + Math.pow(spinA, 1.4) * 36.3).toFixed(1)
      : (5.7 - spinA * 2.1).toFixed(1);

  // Объект параметров для передачи в генераторы текста
  const lectureValues: LectureValues = {
    spinA,
    magneticFieldB,
    rPlusVal,
    rErgoEq,
    progradeISCOVal,
    retrogradeISCOVal,
    activeISCOVal,
    jetPowerVal,
    penroseEfficiency,
    accretionEfficiency,
    orbitDirection,
    madState,
  };

  const applyPreset = (presetKey: 'schwarzschild' | 'm87_quasar' | 'retrograde_trap') => {
    if (presetKey === 'schwarzschild') {
      setSpinA(0.0);
      setMagneticFieldB(0.5);
      setOrbitDirection('prograde');
      setMadState(false);
    } else if (presetKey === 'm87_quasar') {
      setSpinA(0.94);
      setMagneticFieldB(0.95);
      setOrbitDirection('prograde');
      setMadState(true);
    } else if (presetKey === 'retrograde_trap') {
      setSpinA(0.95);
      setMagneticFieldB(0.4);
      setOrbitDirection('retrograde');
      setMadState(false);
    }
  };

  const isTask2Solved = activeISCOVal <= (TASK2.targetISCO || 1.25) && jetPowerVal >= (TASK2.targetJetPower || 75);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* ШАПКА ЛЕКЦИИ */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{LECTURE_HEADER.backButton}</span>
          </button>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                {LECTURE_HEADER.eyebrow}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {LECTURE_HEADER.badgeRight}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              {LECTURE_HEADER.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory' ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.theory}</span>
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'controls' ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.controls}</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tasks' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{LECTURE_HEADER.tabs.tasks}</span>
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400">{AUDIENCE_LABELS.caption}</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAudience('school')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'school' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400'
                    }`}
                  >
                    {AUDIENCE_LABELS.school}
                  </button>
                  <button
                    onClick={() => setAudience('university')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      audience === 'university' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-slate-400'
                    }`}
                  >
                    {AUDIENCE_LABELS.university}
                  </button>
                </div>
              </div>

              {/* Глава А: Эргосфера */}
              {chapter === 'ergosphere' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-indigo-300">{ERGOSPHERE_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{getErgosphereIntro(audience)}</p>
                  
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="font-mono text-indigo-300 font-semibold text-xs mb-3">{ERGOSPHERE_CARD_HEADING}</div>
                    {getErgosphereCardParagraphs(lectureValues, audience).map((p, idx) => (
                      <div key={p.id || idx} className="text-xs space-y-1 text-slate-300">
                        {p.heading && <div className="font-bold text-slate-200">{p.heading}</div>}
                        {p.formula && <div className="font-mono text-indigo-400">{p.formula}</div>}
                        <p className="leading-relaxed">
                          {/* Поддержка как строкового текста, так и сегментов */}
                          {typeof p.text === 'string' ? p.text : p.text[audience]}
                          {p.segments?.map((seg, i) => (
                            <span key={i} className={seg.colorKey ? `text-${seg.colorKey}-300` : ''}>
                              {seg.text}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Глава Б: ISCO */}
              {chapter === 'isco_shift' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-amber-300">{ISCO_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{ISCO_INTRO[audience]}</p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono text-slate-400">{ISCO_SWITCH_HINT}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOrbitDirection('prograde')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          orbitDirection === 'prograde' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold mb-0.5">{ISCO_OPTIONS.progradeTitle}</div>
                        <div className="font-mono text-[11px]">{ISCO_OPTIONS.progradeRangeLabel}</div>
                      </button>
                      <button
                        onClick={() => setOrbitDirection('retrograde')}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                          orbitDirection === 'retrograde' ? 'bg-rose-500/15 border-rose-500/50 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-bold mb-0.5">{ISCO_OPTIONS.retrogradeTitle}</div>
                        <div className="font-mono text-[11px]">{ISCO_OPTIONS.retrogradeRangeLabel}</div>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {getIscoExplanation(lectureValues, audience)}
                    </p>
                  </div>
                </div>
              )}

              {/* Глава В: Джеты */}
              {chapter === 'jets' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-sky-300">{JETS_TITLE}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{getJetsIntro(audience, lectureValues)}</p>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-400 block">
                      {FORMULA_XRAY_CAPTION}
                    </span>
                    <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                      {FORMULA_BUTTONS.map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setHighlightedTerm(btn.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            highlightedTerm === btn.id ? btn.activeClass : btn.idleClass
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      {getFormulaExplanation(highlightedTerm, lectureValues, audience)}
                    </div>
                  </div>
                </div>
              )}

              {/* Быстрые пресеты */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="text-xs font-mono text-slate-400 uppercase">{PRESET_LABELS.caption}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => applyPreset('schwarzschild')} className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium">
                    {PRESET_LABELS.schwarzschild}
                  </button>
                  <button onClick={() => applyPreset('m87_quasar')} className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[11px] text-sky-300 font-medium">
                    {PRESET_LABELS.m87_quasar}
                  </button>
                  <button onClick={() => applyPreset('retrograde_trap')} className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] text-rose-300 font-medium">
                    {PRESET_LABELS.retrograde_trap}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: УПРАВЛЕНИЕ 3D-ПЕСОЧНИЦЕЙ */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              
              {/* Живое табло формул */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">Живые уравнения Керра — Знаека</span>
                  <span className="text-[11px] font-mono text-slate-400">a* = {spinA.toFixed(2)} · B = {(magneticFieldB * 100).toFixed(0)}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">1. Сжатие горизонта событий вращением r_+ = ½ r_s · (1 + √(1 - a*²)):</div>
                  <div className="text-slate-200">
                    r_+ = 0.5 · (1 + √(1 - <span className="text-indigo-400">{spinA.toFixed(2)}²</span>)) = <strong className="text-sky-300">{rPlusVal.toFixed(2)} r_s</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">2. Увлечение пространства (член Лензе — Тирринга g_tφ ∝ -a*):</div>
                  <div className="text-indigo-300">
                    g_tφ = -r_s · a* / r ⇒ <strong>{spinA === 0 ? '0.00 (Пространство не вращается)' : `-${(spinA * 0.85).toFixed(2)} (Вихрь активен)`}</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">3. Мощность магнитного джета P_BZ = k · a*² · B²:</div>
                  <div className="text-slate-200">
                    P_BZ = {madState ? '1.25 (MAD) × ' : '1.00 × '}(<span className="text-indigo-400">{spinA.toFixed(2)}</span>)² × (<span className="text-sky-400">{magneticFieldB.toFixed(2)}</span>)² = <strong className="text-emerald-400">{jetPowerVal}%</strong>
                  </div>
                </div>
              </div>

              {/* Ползунки */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium"><RotateCw className="w-3.5 h-3.5 text-indigo-400" />Спин вращения ЧД (a*)</span>
                  <span className="font-mono font-bold text-indigo-400">{spinA.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="0.99" step="0.01" value={spinA} onChange={(e) => setSpinA(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium"><Magnet className="w-3.5 h-3.5 text-sky-400" />Магнитное поле (B)</span>
                  <span className="font-mono font-bold text-sky-400">{(magneticFieldB * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={magneticFieldB} onChange={(e) => setMagneticFieldB(parseFloat(e.target.value))} className="w-full accent-sky-500 cursor-pointer" />
              </div>

              {/* Переключатели */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setOrbitDirection(orbitDirection === 'prograde' ? 'retrograde' : 'prograde')} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-xs font-medium flex items-center justify-center gap-2 text-amber-300">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{orbitDirection === 'prograde' ? 'Попутный диск' : 'Встречный диск'}</span>
                </button>
                <button onClick={() => setMadState(!madState)} className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${madState ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Режим MAD: {madState ? 'ВКЛ' : 'ВЫКЛ'}</span>
                </button>
              </div>

              {/* Чекбоксы */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Слои 3D-сцены</div>
                {[
                  { label: 'Оболочка эргосферы', checked: showErgosphere, setter: setShowErgosphere },
                  { label: 'Увлечение пространства', checked: showFrameDraggingGrid, setter: setShowFrameDraggingGrid },
                  { label: 'Аккреционный диск и ISCO', checked: showAccretionDisk, setter: setShowAccretionDisk },
                  { label: 'Магнитная башня джета', checked: showMagneticHelix, setter: setShowMagneticHelix },
                ].map((item) => (
                  <label key={item.label} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
                    <span>{item.label}</span>
                    <input type="checkbox" checked={item.checked} onChange={(e) => item.setter(e.target.checked)} className="accent-indigo-500 w-4 h-4 rounded" />
                  </label>
                ))}
              </div>

            </div>
          )}

          {/* ВКЛАДКА 3: ЗАДАЧИ */}
          {activeTab === 'tasks' && (
            <div className="space-y-5">
              {/* Задача 1 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{TASK1.badge}</span>
                  <button onClick={() => setShowHint1(!showHint1)} className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Подсказка</button>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{TASK1.question}</h3>
                {showHint1 && <p className="text-xs text-indigo-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">{TASK1.hint}</p>}
                <div className="space-y-2">
                  {TASK1.options?.map((opt) => (
                    <button key={opt.id} onClick={() => setTask1Answer(opt.id)} className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex justify-between items-center ${
                        task1Answer === opt.id ? (opt.correct ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200' : 'bg-rose-500/15 border-rose-500/50 text-rose-200') : 'bg-slate-950/70 border-slate-800 text-slate-300'
                    }`}>
                      <span>{opt.label}</span>
                      {task1Answer === opt.id && (opt.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Задача 2 */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{TASK2.badge}</span>
                  <button onClick={() => setShowHint2(!showHint2)} className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Условие</button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{TASK2.description}</p>
                {showHint2 && <p className="text-xs text-amber-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">{TASK2.hint}</p>}
                
                <div className="space-y-2 pt-1">
                  <input type="range" min="0" max="0.99" step="0.01" value={spinA} onChange={(e) => setSpinA(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                  <input type="range" min="0" max="1" step="0.05" value={magneticFieldB} onChange={(e) => setMagneticFieldB(parseFloat(e.target.value))} className="w-full accent-sky-500 cursor-pointer" />
                </div>
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isTask2Solved ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  {isTask2Solved ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>{TASK2.getSuccessText?.(activeISCOVal, jetPowerVal)}</span></>
                  ) : (
                    <span>{TASK2.getPendingText?.(activeISCOVal, jetPowerVal)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: ИЗОЛИРОВАННАЯ 3D-СЦЕНА */}
        <div className="lg:col-span-7 relative bg-slate-950 min-h-[460px] flex flex-col">
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono">
              <span className="text-indigo-300">● Эргосфера (a* = {spinA.toFixed(2)})</span>
              <span className="text-amber-300">--- ISCO ({activeISCOVal.toFixed(2)} r_s · {orbitDirection === 'prograde' ? 'Попутный' : 'Встречный'})</span>
              <span className="text-sky-300 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Джет ({jetPowerVal}%)</span>
            </div>
          </div>

          <div className="flex-1 w-full h-full relative">
            {/* Рендеринг вынесен в отдельный компонент! */}
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
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800">
            <div className="flex items-center gap-4 text-xs font-mono px-2">
              <div><span className="text-slate-500">Горизонт r_+: </span><span className="text-slate-200 font-bold">{rPlusVal.toFixed(2)} r_s</span></div>
              <div><span className="text-slate-500">КПД диска: </span><span className="text-emerald-400 font-bold">{accretionEfficiency}%</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => applyPreset('schwarzschild')} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">Статика</button>
              <button onClick={() => applyPreset('m87_quasar')} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-colors">Джет M87*</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}