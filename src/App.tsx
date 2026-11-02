import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import {
  Atom,
  Calculator,
  BookOpen,
  Dna,
  Sparkles,
  Search,
  ChevronRight,

  Layers,
  X,
  ArrowLeft,
} from 'lucide-react';

// Ленивая подгрузка модулей лекций
const IntroRelativityLab = lazy(() => import('./components/sandboxes/IntroRelativityLab'));
const SchwarzschildLab = lazy(() => import('./components/sandboxes/SchwarzschildLab'));
const KerrJetsLab = lazy(() => import('./components/sandboxes/KerrJetsLabPage'));

// ==========================================
// 1. ОПРЕДЕЛЕНИЕ ТИПОВ (TypeScript Interfaces)
// ==========================================

export type TrackId = 'physics' | 'higher-math' | 'school-math' | 'biology' | 'synthesis';

export type DifficultyFilter = 'Все уровни' | '10–11 классы' | 'Вуз (1–3 курсы)';

export type AccentColor = 'sky' | 'amber' | 'emerald' | 'rose' | 'indigo';

export interface TrackItem {
  id: TrackId;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: AccentColor;
  badges: string[];
  level: 'Вуз' | '10–11 класс' | 'Школа / Вуз';
  modulesCount: number;
}

export interface MetricItem {
  label: string;
  value: string;
}



// ==========================================
// 2. КОНФИГУРАЦИЯ ДАННЫХ И ЦВЕТОВЫХ ТЕМ
// ==========================================

const DIFFICULTY_OPTIONS: DifficultyFilter[] = [
  'Все уровни',
  '10–11 классы',
  'Вуз (1–3 курсы)',
];

const METRICS_BAR: MetricItem[] = [
  { label: 'Интерактивных песочниц', value: '16+' },
  { label: 'Формул с разбором', value: '120+' },
  { label: 'Режимы', value: '2D / 3D WebGL' },
];

const TRACKS_DATA: TrackItem[] = [
  {
    id: 'physics',
    title: 'Теоретическая физика',
    description:
      'Общая теория относительности, метрика пространства-времени, квантовая механика и астрофизика.',
    icon: Atom,
    accentColor: 'sky',
    badges: ['3D Метрика Шварцшильда', 'Эргосфера Керра', 'Тензоры'],
    level: 'Вуз',
    modulesCount: 5,
  },
  {
    id: 'higher-math',
    title: 'Высшая математика',
    description:
      'Тензорный анализ, линейная алгебра, дифференциальные уравнения и многомерная геометрия.',
    icon: Calculator,
    accentColor: 'amber',
    badges: ['Матричные преобразования', 'Векторные поля', 'Ранг 1–4'],
    level: 'Вуз',
    modulesCount: 4,
  },
  {
    id: 'school-math',
    title: 'Школьная математика',
    description:
      'Наглядная тригонометрия, стереометрия, параболы и визуальные доказательства для 10–11 классов.',
    icon: BookOpen,
    accentColor: 'emerald',
    badges: ['Тригонометрический круг', 'Сечения 3D-тел', 'Парабола'],
    level: '10–11 класс',
    modulesCount: 4,
  },
  {
    id: 'biology',
    title: 'Биология и анатомия',
    description:
      'Биомеханика суставов, гидродинамика кровотока, нейрофизиология и клеточная биофизика.',
    icon: Dna,
    accentColor: 'rose',
    badges: ['Потенциал Ходжкина-Хаксли', '3D-суставы', 'Уравнения Навье-Стокса'],
    level: 'Школа / Вуз',
    modulesCount: 3,
  },
];

// Словарь статических классов Tailwind (чтобы JIT-компилятор не удалил динамические цвета)
const ACCENT_STYLES: Record<
  AccentColor,
  {
    iconBg: string;
    iconText: string;
    cardHoverBorder: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
  }
> = {
  sky: {
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    iconText: 'text-sky-400',
    cardHoverBorder: 'hover:border-sky-500/50',
    badgeBg: 'bg-sky-500/10 border-sky-500/20',
    badgeText: 'text-sky-300',
    glow: 'group-hover:shadow-[0_0_35px_-5px_rgba(56,189,248,0.2)]',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconText: 'text-amber-400',
    cardHoverBorder: 'hover:border-amber-500/50',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
    badgeText: 'text-amber-300',
    glow: 'group-hover:shadow-[0_0_35px_-5px_rgba(251,191,36,0.2)]',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconText: 'text-emerald-400',
    cardHoverBorder: 'hover:border-emerald-500/50',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-300',
    glow: 'group-hover:shadow-[0_0_35px_-5px_rgba(52,211,153,0.2)]',
  },
  rose: {
    iconBg: 'bg-rose-500/10 border-rose-500/20',
    iconText: 'text-rose-400',
    cardHoverBorder: 'hover:border-rose-500/50',
    badgeBg: 'bg-rose-500/10 border-rose-500/20',
    badgeText: 'text-rose-300',
    glow: 'group-hover:shadow-[0_0_35px_-5px_rgba(251,113,133,0.2)]',
  },
  indigo: {
    iconBg: 'bg-indigo-500/15 border-indigo-500/30',
    iconText: 'text-indigo-400',
    cardHoverBorder: 'hover:border-indigo-500/60',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/25',
    badgeText: 'text-indigo-300',
    glow: 'group-hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.25)]',
  },
};

// ==========================================
// 3. ИНТЕРАКТИВНЫЙ ФОН (HTML5 Canvas Mesh)
// ==========================================

function InteractiveParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Создаем узлы пространственной сетки
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Легкое гравитационное притяжение к курсору мыши
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 180 && distMouse > 5) {
          p.x += (dxMouse / distMouse) * 0.35;
          p.y += (dyMouse / distMouse) * 0.35;
        }

        // Отрисовка узла
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fill();

        // Отрисовка связей между близкими узлами
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 140) * 0.15;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}

// ==========================================
// 4. ГЛАВНЫЙ КОМПОНЕНТ ХАБА (Landing Hub)
// ==========================================

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyFilter>('Все уровни');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTrack, setActiveTrack] = useState<TrackId | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<'intro-relativity' | 'schwarzschild' | 'kerr-jets' | null>(null);

  // Фильтрация направлений по уровню сложности и поисковому запросу
  const filteredTracks = useMemo(() => {
    return TRACKS_DATA.filter((track) => {
      // 1. Фильтр по уровню
      const matchesDifficulty =
        selectedDifficulty === 'Все уровни' ||
        (selectedDifficulty === '10–11 классы' &&
          (track.level === '10–11 класс' || track.level === 'Школа / Вуз')) ||
        (selectedDifficulty === 'Вуз (1–3 курсы)' &&
          (track.level === 'Вуз' || track.level === 'Школа / Вуз'));

      // 2. Фильтр по поиску (заголовок, описание, бейджи)
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        track.title.toLowerCase().includes(query) ||
        track.description.toLowerCase().includes(query) ||
        track.badges.some((badge) => badge.toLowerCase().includes(query));

      return matchesDifficulty && matchesSearch;
    });
  }, [selectedDifficulty, searchQuery]);

  // Экран выбранного направления (заглушка перед подключением роутера/песочниц)
  // Если пользователь выбрал «Теоретическая физика» — открываем изолированную 3D-лабораторию Шварцшильда
  // 1. Если открыт конкретный 3D-урок — рендерим его в изолированном Suspense-контейнере
  if (activeLessonId === 'intro-relativity') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-emerald-400">Загрузка Вводной лекции 00 (Основы ОТО и Тензоры)...</span>
          </div>
        }
      >
        <IntroRelativityLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }
  if (activeLessonId === 'schwarzschild') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-sky-400">Загрузка 3D-лаборатории Шварцшильда...</span>
          </div>
        }
      >
        <SchwarzschildLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }

  if (activeLessonId === 'kerr-jets') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-indigo-400">Загрузка 3D-лаборатории Керра и Джетов...</span>
          </div>
        }
      >
        <KerrJetsLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }

  // 2. Если выбран раздел «Теоретическая физика» — показываем каталог лекций этого раздела
  if (activeTrack === 'physics') {
    const physicsLessons = [
      {
        id: 'intro-relativity' as const,
        number: 'Вводная лекция 00 · Старт курса',
        title: 'Как работает ОТО: Принцип эквивалентности, Световые конусы и Тензоры (0–4)',
        description:
          'Почему тела падают в сторону медленных часов, как гравитация наклоняет световые конусы будущего и как устроены матрицы метрики g_μν, символы Кристоффеля и тензор Римана.',
        badges: ['Лифт Эйнштейна', 'Наклон световых конусов', 'Инспектор тензоров 0–4'],
        accent: 'border-emerald-500/40 hover:border-emerald-400',
        available: true,
      },
      {
        id: 'schwarzschild' as const,
        number: 'Лекция 01',
        title: 'Статичная ЧД: Метрика Шварцшильда, Фотонная сфера и ISCO',
        description:
          'Трёхмерное радиальное сжатие сетки пространства, захват фотонов на 1.5 r_s (прицельный параметр b ≈ 2.6 r_s) и срыв круговых орбит внутри границы 3.0 r_s.',
        badges: ['3D Сетка объёма', 'Фотонная сфера 1.5 r_s', 'Граница ISCO 3.0 r_s'],
        accent: 'border-sky-500/40 hover:border-sky-400',
        available: true,
      },
      {
        id: 'kerr-jets' as const,
        number: 'Лекция 02',
        title: 'Вращающаяся ЧД: Метрика Керра, Эргосфера и Релятивистские джеты',
        description:
          'Увлечение пространства Лензе — Тирринга, сжатие радиуса ISCO до 0.5 r_s, аккреционный диск и магнитогидродинамический запуск джетов (механизм Блэндфорда — Знаека).',
        badges: ['Эргосфера Керра', 'Механизм Блэндфорда-Знаека', '3D Биполярные джеты'],
        accent: 'border-indigo-500/40 hover:border-indigo-400',
        available: true,
      },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 relative overflow-hidden">
        <InteractiveParticleBackground />
        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          <button
            onClick={() => setActiveTrack(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную в каталог направлений
          </button>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
              Направление · Теоретическая физика
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
              Общая теория относительности и астрофизика
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Выберите интерактивную лекцию. Каждый модуль запускается в собственном изолированном 3D WebGL-контексте.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {physicsLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`group text-left p-6 rounded-2xl bg-slate-900/70 backdrop-blur-md border ${lesson.accent} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6`}
              >
                <div className="space-y-2.5">
                  <span className="text-xs font-mono text-sky-400">{lesson.number}</span>
                  <h2 className="text-xl font-bold text-slate-100 group-hover:text-white">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {lesson.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {lesson.badges.map((b) => (
                      <span
                        key={b}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold shrink-0 self-start sm:self-center group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors flex items-center gap-1.5">
                  <span>Открыть 3D-урок</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 relative overflow-x-hidden">
      {/* Интерактивная фоновая сетка */}
      <InteractiveParticleBackground />

      {/* Декоративное верхнее свечение */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[750px] h-[280px] bg-sky-500/10 blur-[130px] pointer-events-none z-0" />

      {/* ШАПКА (Header) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Логотип */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Atom className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">
                  STEM Энциклопедия
                </span>
                <span className="text-[11px] font-mono text-slate-400 tracking-wider uppercase">
                  Explorable Explanations
                </span>
              </div>
            </div>
          </div>

          {/* Переключатель уровня сложности */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
            {DIFFICULTY_OPTIONS.map((option) => {
              const isActive = selectedDifficulty === option;
              return (
                <button
                  key={option}
                  onClick={() => setSelectedDifficulty(option)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Строка поиска и GitHub */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск темы, симуляции или формулы..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-900/80 border border-slate-800 focus:border-sky-500/60 focus:outline-none rounded-xl text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* HERO SECTION */}
        <section className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-sky-400 mb-5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            ИНТЕРАКТИВНАЯ НАУЧНАЯ ПЛАТФОРМА
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-[1.15]">
            Интерактивные исследования{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300">
              пространства, чисел и жизни.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-8">
            От тензорного анализа и метрики Шварцшильда до клеточной биофизики.
            Исследуйте науку через интерактивные 3D-симуляции и динамические формулы.
          </p>

          {/* Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-xl p-4 rounded-2xl bg-slate-900/50 border border-slate-800/90 backdrop-blur-sm">
            {METRICS_BAR.map((metric) => (
              <div key={metric.label} className="border-r last:border-r-0 border-slate-800 pr-3">
                <div className="text-lg md:text-xl font-bold text-slate-100 font-mono">
                  {metric.value}
                </div>
                <div className="text-xs text-slate-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* СЕТКА НАПРАВЛЕНИЙ (Tracks Grid 2x2) */}
        <section className="space-y-6">
          {filteredTracks.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <p className="text-slate-300 font-medium">
                По вашему запросу «{searchQuery}» в категории «{selectedDifficulty}» ничего не найдено.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('Все уровни');
                }}
                className="text-xs text-sky-400 hover:underline font-mono"
              >
                Сбросить все фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTracks.map((track) => {
                const styles = ACCENT_STYLES[track.accentColor];
                const IconComponent = track.icon;

                return (
                  <button
                    key={track.id}
                    onClick={() => setActiveTrack(track.id)}
                    className={`group flex flex-col justify-between text-left p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 ${styles.cardHoverBorder} hover:bg-slate-900/90 transition-all duration-300 ${styles.glow} relative overflow-hidden`}
                  >
                    <div>
                      {/* Верхняя строка карточки: иконка + тег уровня */}
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div
                          className={`p-3.5 rounded-xl border ${styles.iconBg} ${styles.iconText} transition-transform duration-300 group-hover:scale-105`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300">
                            {track.level}
                          </span>
                          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-400">
                            {track.modulesCount} модулей
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-200 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>

                      {/* Заголовок и описание */}
                      <h2 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">
                        {track.title}
                      </h2>
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        {track.description}
                      </p>
                    </div>

                    {/* Бейджи ключевых симуляций */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                      {track.badges.map((badge) => (
                        <span
                          key={badge}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${styles.badgeBg} ${styles.badgeText}`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* БАННЕР МЕЖДИСЦИПЛИНАРНОГО СИНТЕЗА (Full-width Synthesis Banner) */}
          <button
            onClick={() => setActiveTrack('synthesis')}
            className={`group w-full text-left p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 backdrop-blur-md border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 ${ACCENT_STYLES.indigo.glow} relative overflow-hidden`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start md:items-center gap-4">
                <div className="p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Финальный уровень · Конвергенция
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-1">
                    Лаборатория междисциплинарного синтеза
                  </h3>
                  <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Сквозные симуляции: биофизика мембран, дифференциальные уравнения популяций и релятивистская астрофизика в одном холсте.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all shrink-0">
                <span>Открыть полигон</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}