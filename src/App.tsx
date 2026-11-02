import React, { useState, Suspense, lazy } from 'react';
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
const KerrJetsLab = lazy(() => import('./components/sandboxes/KerrJetsLab'));

// Описание направлений энциклопедии
const TRACKS = [
  {
    id: 'physics',
    title: 'Теоретическая физика',
    subtitle: 'Школа (10–11 кл) & Вуз (1–3 курс)',
    description: 'Общая теория относительности, метрика пространства-времени, световые конусы, вращение Керра и релятивистские джеты.',
    icon: Atom,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'hover:border-sky-500/50',
    badge: '3D WebGL Лаборатории',
  },
  {
    id: 'higher-math',
    title: 'Высшая математика',
    subtitle: 'Университетский курс',
    description: 'Тензорный анализ (ранги 0–4), линейная алгебра, матричные операторы и дифференциальные уравнения.',
    icon: Calculator,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/50',
    badge: 'Живые матрицы',
  },
  {
    id: 'school-math',
    title: 'Школьная математика',
    subtitle: '10–11 классы и Олимпиады',
    description: 'Наглядная тригонометрия, стереометрия, производные, параболы и геометрические доказательства.',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'hover:border-emerald-500/50',
    badge: 'Интуитивная геометрия',
  },
  {
    id: 'biology',
    title: 'Биология и биофизика',
    subtitle: 'Анатомия & Динамика жизни',
    description: 'Биомеханика суставов, гидродинамика кровотока, нейрофизиология и клеточные структуры.',
    icon: Dna,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'hover:border-rose-500/50',
    badge: 'Интерактивный атлас',
  },
];

export default function App() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalLevel, setGlobalLevel] = useState<'all' | 'school' | 'university'>('all');

  // 1. Рендер выбранной 3D-лаборатории
  if (activeLessonId === 'intro-relativity') {
    return (
      <Suspense fallback={<LoadingScreen text="Загрузка вводной лекции 00 (Основы ОТО и Тензоры)..." color="emerald" />}>
        <IntroRelativityLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }

  if (activeLessonId === 'schwarzschild') {
    return (
      <Suspense fallback={<LoadingScreen text="Загрузка 3D-лаборатории Шварцшильда..." color="sky" />}>
        <SchwarzschildLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }

  if (activeLessonId === 'kerr-jets') {
    return (
      <Suspense fallback={<LoadingScreen text="Загрузка 3D-лаборатории Керра и Джетов..." color="indigo" />}>
        <KerrJetsLab onBack={() => setActiveLessonId(null)} />
      </Suspense>
    );
  }

  // 2. Рендер каталога тем внутри раздела «Теоретическая физика»
  if (activeTrack === 'physics') {
    const physicsLessons = [
      {
        id: 'intro-relativity',
        number: 'Вводная лекция 00',
        title: 'Как работает ОТО: Принцип эквивалентности, Световые конусы и Тензоры (0–4)',
        description: 'Почему тела падают в сторону медленных часов, как гравитация наклоняет световые конусы будущего и как устроены матрицы метрики g_μν, символы Кристоффеля и тензор Римана.',
        level: 'school & university',
        badges: ['Лифт Эйнштейна', 'Наклон световых конусов', 'Инспектор тензоров 0–4'],
        accent: 'border-emerald-500/40 hover:border-emerald-400',
      },
      {
        id: 'schwarzschild',
        number: 'Лекция 01',
        title: 'Статичная ЧД: Метрика Шварцшильда, Фотонная сфера и ISCO',
        description: 'Трёхмерное радиальное сжатие сетки пространства, захват фотонов на 1.5 r_s (прицельный параметр b ≈ 2.6 r_s) и срыв круговых орбит внутри границы 3.0 r_s.',
        level: 'university',
        badges: ['3D Сетка объёма', 'Фотонная сфера 1.5 r_s', 'Граница ISCO 3.0 r_s'],
        accent: 'border-sky-500/40 hover:border-sky-400',
      },
      {
        id: 'kerr-jets',
        number: 'Лекция 02',
        title: 'Вращающаяся ЧД: Метрика Керра, Эргосфера и Релятивистские джеты',
        description: 'Увлечение пространства Лензе — Тирринга, сжатие радиуса ISCO до 0.5 r_s, аккреционный диск и магнитогидродинамический запуск джетов (механизм Блэндфорда — Знаека).',
        level: 'university',
        badges: ['Эргосфера Керра', 'Механизм Блэндфорда-Знаека', '3D Биполярные джеты'],
        accent: 'border-indigo-500/40 hover:border-indigo-400',
      },
    ];

    const filteredLessons = physicsLessons.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 relative overflow-hidden font-sans">
        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          <button
            onClick={() => setActiveTrack(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную в каталог направлений
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
                Направление · Теоретическая физика
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
                Общая теория относительности и астрофизика
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                От принципа эквивалентности до вращающихся чёрных дыр и релятивистских джетов. Каждый модуль работает в изолированной 3D-песочнице.
              </p>
            </div>

            {/* Строка поиска по темам раздела */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по лекциям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`group text-left p-6 rounded-2xl bg-slate-900/70 backdrop-blur-md border ${lesson.accent} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">{lesson.number}</span>
                    <span className="text-[11px] font-mono text-slate-400">Уровень: {lesson.level}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 group-hover:text-white">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {lesson.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
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

  // Заглушка для пока еще разрабатываемых разделов (Вышмат, Школа, Биология)
  if (activeTrack) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center flex-col gap-4 font-sans p-6 text-center">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">Модуль в разработке</h2>
        <p className="text-slate-400 text-sm max-w-md">
          Интерактивные лаборатории и статьи для этого направления готовятся к публикации. Сейчас вы можете протестировать раздел «Теоретическая физика».
        </p>
        <button
          onClick={() => setActiveTrack(null)}
          className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  // 3. Главная страница (Выбор направления)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30">
      <header className="border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Atom className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide block leading-none">STEM Энциклопедия</span>
              <span className="text-[10px] font-mono text-slate-400">Школа 10–11 кл & Университет</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Интерактивные Explorable Explanations</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Изучайте науку через <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400">
              живые 3D-модели и формулы.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            От школьной тригонометрии и производных до тензорного анализа, метрики Шварцшильда и релятивистских джетов. Выберите интересующее вас направление:
          </p>
        </div>

        {/* Сетка направлений 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`group flex flex-col text-left p-7 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-slate-800 transition-all duration-300 ${track.border} hover:bg-slate-900/80 relative overflow-hidden cursor-pointer shadow-xl`}
            >
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className={`p-3.5 rounded-2xl ${track.bg} ${track.color}`}>
                  <track.icon className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400">
                    {track.badge}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors transform group-hover:translate-x-1" />
                </div>
              </div>

              <span className="text-xs font-mono text-sky-400 mb-1">{track.subtitle}</span>
              <h2 className="text-2xl font-bold mb-2.5 text-slate-100 group-hover:text-white">{track.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                {track.description}
              </p>
            </button>
          ))}
        </div>

        {/* Финальный междисциплинарный блок синтеза */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900/60 border border-sky-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono">
              <Layers className="w-4 h-4" />
              <span>Финальный модуль синтеза</span>
            </div>
            <h3 className="text-xl font-bold text-white">Междисциплинарный синтез: Теория всего</h3>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Узнайте, как математические матрицы объединяются с законами общей теории относительности и клеточной биофизикой в единую картину мира.
            </p>
          </div>
          <button
            onClick={() => alert('Модуль междисциплинарного синтеза открывается после прохождения базовых лекций по физике!')}
            className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-lg shadow-sky-500/20"
          >
            Исследовать связи наук
          </button>
        </div>
      </main>
    </div>
  );
}

// Вспомогательный компонент экрана загрузки
function LoadingScreen({ text, color }: { text: string; color: 'sky' | 'emerald' | 'indigo' }) {
  const borderColors = {
    sky: 'border-sky-500 text-sky-400',
    emerald: 'border-emerald-500 text-emerald-400',
    indigo: 'border-indigo-500 text-indigo-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-3 font-sans">
      <div className={`w-8 h-8 border-2 ${borderColors[color]} border-t-transparent rounded-full animate-spin`} />
      <span className="text-xs font-mono">{text}</span>
    </div>
  );
}