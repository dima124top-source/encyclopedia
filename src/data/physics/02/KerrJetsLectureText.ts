export type AudienceLevel = 'school' | 'university';
export type KerrChapter = 'ergosphere' | 'isco_shift' | 'jets';
export type FormulaTerm = 'gtphi' | 'ergo' | 'bz_power' | null;

export interface LectureValues {
  spinA: number;
  magneticFieldB?: number;
  rPlusVal: number;
  rErgoEq?: number;
  progradeISCOVal: number;
  retrogradeISCOVal: number;
  activeISCOVal?: number;
  jetPowerVal: number;
  penroseEfficiency: string | number;
  accretionEfficiency: string | number;
  orbitDirection?: 'prograde' | 'retrograde';
  madState?: boolean;
}

export interface RichParagraph {
  id?: string;
  heading?: string;
  text: string | Record<AudienceLevel, string>;
  formula?: string;
  highlight?: string;
  segments?: Array<{ text: string; colorKey?: 'sky' | 'amber' | 'emerald' }>;
}

export interface LectureHeader {
  backButton: string;
  backLabel: string;
  eyebrow: string;
  badge: string;
  badgeLeft: string;
  badgeRight: string;
  title: string;
  tabs: {
    theory: string;
    controls: string;
    tasks: string;
  };
}

export interface TaskData {
  id?: string;
  badge: string;
  hintButton: string;
  question?: string;
  description?: string;
  hint: string;
  options?: Array<{ id: string; label: string; correct: boolean }>;
  targetISCO?: number;
  maxISCO?: number;
  targetJetPower?: number;
  minJetPower?: number;
  getSuccessText?: (isco: number, power: number) => string;
  getPendingText?: (isco: number, power: number) => string;
}

// ==========================================
// НАВИГАЦИЯ И ШАПКА
// ==========================================

export const LECTURE_HEADER: LectureHeader = {
  backButton: 'К списку лекций',
  backLabel: 'Меню',
  eyebrow: 'Лекция 02',
  badge: 'Вращение Керра',
  badgeLeft: 'Лекция 02 · Релятивистская астрофизика',
  badgeRight: 'Керр · Эргосфера · Сдвиг ISCO · Джеты',
  title: 'Вращение Керра, увлечение пространства и запуск релятивистских джетов',
  tabs: {
    theory: '1. Теория (3 главы)',
    controls: '2. Песочница',
    tasks: '3. Задачи (2)',
  },
};

export const CHAPTER_TABS: { id: KerrChapter; title: string }[] = [
  { id: 'ergosphere', title: 'А. Эргосфера Керра' },
  { id: 'isco_shift', title: 'Б. Сдвиг ISCO' },
  { id: 'jets', title: 'В. Физика Джетов' },
];

export const AUDIENCE_LABELS = {
  caption: 'Уровень строгости:',
  school: '10–11 класс',
  university: 'Вуз (ОТО / МГД)',
};

export const PRESET_LABELS = {
  caption: 'Быстрые астрофизические сценарии:',
  schwarzschild: 'Статика (a* = 0)',
  m87_quasar: 'Квазар M87* (MAD)',
  retrograde_trap: 'Встречный диск',
};

// ==========================================
// ГЛАВА А: ЭРГОСФЕРА КЕРРА И ПРОЦЕСС ПЕНРОУЗА
// ==========================================

export const ERGOSPHERE_TITLE = 'Что происходит с пространством, когда чёрная дыра вращается?';

export function getErgosphereIntro(audience: AudienceLevel): string {
  if (audience === 'school') {
    return (
      'В реальном космосе все звёзды вращаются вокруг своей оси. Когда массивная звезда в конце жизни сжимается в миллионы раз, срабатывает закон сохранения момента импульса (как у фигуриста, прижимающего руки к груди), и рождается бешено вращающаяся чёрная дыра Керра (1963). ' +
      'Она работает как гигантский блендер в густом мёде: вращающаяся масса буквально тянет и закручивает само пустое пространство вокруг себя (эффект увлечения Лензе — Тирринга)!'
    );
  }
  return (
    'Стационарное осесимметричное вакуумное решение уравнений Эйнштейна (R_μν = 0), полученное Роем Керром (1963), в сплюснутых сфероидальных координатах Бойера — Линдквиста (t, r, θ, φ) зависит от массы M и безразмерного спина a* = cJ/(GM²) ∈ [0, 1]. ' +
    'Вращение центрального тела порождает недиагональную компоненту метрического тензора g_tφ = -(r_s·r·a·sin²θ)/ρ², сцепляющую координатное время t и азимутальный угол φ: инерциальные системы отсчёта увлекаются во вращение с угловой скоростью ω = -g_tφ / g_φφ (эффект Лензе — Тирринга).'
  );
}

export const ERGOSPHERE_CARD_HEADING = 'Предел статичности, Эргосфера и процесс Пенроуза (Фиолетовая оболочка в 3D)';

export function getErgosphereCardParagraphs(
  values: LectureValues,
  audience: AudienceLevel = 'university'
): RichParagraph[] {
  const rPlusStr = values.rPlusVal.toFixed(2);
  const penroseStr = String(values.penroseEfficiency);

  if (audience === 'school') {
    return [
      {
        id: 'ergo-school-1',
        heading: '1. Сжатие горизонта и кольцевая сингулярность',
        formula: `r_+ = ½ r_s · (1 + √(1 - a*²)) = ${rPlusStr} r_s`,
        text: `Из-за центробежного эффекта горизонт событий сжимается с 1.00 r_s до ${rPlusStr} r_s (а при предельном вращении a* → 1 сжимается ровно вдвое — до 0.50 r_s!). Центральная сингулярность перестаёт быть точкой и растягивается во вращающееся кольцо в плоскости экватора.`,
      },
      {
        id: 'ergo-school-2',
        heading: '2. Эргосфера — водоворот быстрее света',
        formula: 'r_ergo(экватор) = 1.00 r_s  >  r_+',
        text: `Между сжатым горизонтом (${rPlusStr} r_s) и старым радиусом Шварцшильда (1.00 r_s на экваторе) возникает сплюснутая фиолетовая оболочка — эргосфера. Внутри неё пространство течёт быстрее света относительно далёких звёзд: ни один звездолёт там не может зависнуть на месте, его принудительно крутит в сторону вращения дыры!`,
      },
      {
        id: 'ergo-school-3',
        heading: '3. Космическая батарея: Процесс Пенроуза',
        formula: `КПД извлечения (при текущем a*) ≈ ${penroseStr}% mc²`,
        text: `Так как эргосфера находится СНАРУЖИ горизонта событий, корабль может влететь в неё, сбросить балласт против течения пространства в дыру и вылететь обратно с гигантской прибавкой кинетической энергии (до ${penroseStr}% от энергии покоя сброшенного груза), чуть-чуть замедлив вращение самой чёрной дыры!`,
      },
    ];
  }

  return [
    {
      id: 'ergo-uni-1',
      heading: '1. Горизонты Δ(r) = 0 и предел статичности g_tt = 0',
      formula: `Δ = r² - r_s·r + a² = 0  ⇒  r_+ = ${rPlusStr} r_s  |  r_ergo(θ) = ½r_s(1 + √(1 - a*²cos²θ))`,
      text: `Внешний горизонт событий r_+ (${rPlusStr} r_s) отделён от поверхности бесконечного красного смещения g_tt = -(1 - r_s·r/ρ²) = 0 областью эргосферы, которая соприкасается с горизонтом на полюсах (θ = 0, π) и достигает r_ergo = 1.00 r_s на экваторе (θ = π/2). При ρ² = r² + a²cos²θ = 0 возникает кольцевая сингулярность радиуса a.`,
    },
    {
      id: 'ergo-uni-2',
      heading: '2. Пространственноподобный вектор Киллинга и состояния с E < 0',
      formula: 'g_tt > 0 внутри эргосферы  ⇒  E = -p_μ ξ^(t)μ = -p_t может быть < 0',
      text: `Внутри эргосферы (r_+ < r < r_ergo) координатный вектор Киллинга времени ξ^(t) = ∂_t становится пространственноподобным. Любая времениподобная траектория обязана удовлетворять условию dφ/dt > 0 (принудительное увлечение наблюдателей ZAMO с частотой ω = -g_tφ/g_φφ), а для ретроградных осколков допустимы орбиты с отрицательной полной энергией относительно бесконечности.`,
    },
    {
      id: 'ergo-uni-3',
      heading: '3. Процесс Пенроуза и неприводимая масса Кристодулу — Руффини',
      formula: `M_irr = M · √[½(1 + √(1 - a*²))]  ⇒  η_Penrose ≈ ${penroseStr}%`,
      text: `При распаде частицы E_0 = E_1 + E_2 внутри эргосферы поглощение горизонтом фрагмента с отрицательной энергией (E_1 < 0, L_1 < 0) позволяет второму фрагменту уйти на бесконечность с энергией E_2 > E_0. Согласно теореме Хокинга о неубывании площади горизонта (dM_irr ≥ 0), у экстремальной дыры Керра (a* = 1) можно извлечь до 29.29% полной массы-энергии Mc² (в одиночном акте распада — до 20.7%, сейчас ~${penroseStr}%).`,
    },
  ];
}

// ==========================================
// ГЛАВА Б: СДВИГ ГРАНИЦЫ ISCO И КПД АККРЕЦИИ
// ==========================================

export const ISCO_TITLE = 'Почему вращение ЧД расщепляет и сдвигает границу устойчивых орбит ISCO?';

export const ISCO_INTRO: Record<AudienceLevel, string> = {
  school:
    'У неподвижной чёрной дыры Шварцшильда внутренняя кромка аккреционного диска всегда фиксирована на радиусе 3.00 r_s. Но вокруг вращающейся дыры Керра пространство крутится как водоворот! Если газ летит ПО вращению дыры (попутно), поток пространства поддерживает его на орбите и позволяет подойти вплотную к горизонту (до 0.50 r_s). А если газ летит ПРОТИВ вращения (встречно) — встречный вихрь сбрасывает его в дыру гораздо раньше, уже на 4.50 r_s!',
  university:
    'В экваториальной плоскости метрики Керра (θ = π/2) радиальное уравнение геодезических Бардина — Пресса — Тьюкольского содержит член спин-орбитального взаимодействия (-2a·E·L/r³). При соосном вращении (a·L > 0, prograde) он создаёт дополнительный отталкивающий барьер, смещая точку перегиба эффективного потенциала (V\'_eff = V\'\'_eff = 0) от 3.00 r_s вплоть до горизонта r_+ = 0.50 r_s; при ретроградном движении (a·L < 0) — дестабилизирует орбиту, отодвигая ISCO до 4.50 r_s.',
};

export const ISCO_SWITCH_HINT = 'Переключите направление вращения диска и посмотрите на жёлтое кольцо ISCO в 3D:';

export const ISCO_OPTIONS = {
  progradeTitle: 'Попутное (Prograde)',
  retrogradeTitle: 'Встречное (Retrograde)',
  progradeRangeLabel: 'до 0.50 r_s',
  retrogradeRangeLabel: 'до 4.50 r_s',
};

export function getIscoExplanation(
  values: LectureValues,
  audience: AudienceLevel = 'university'
): string {
  const proStr = values.progradeISCOVal.toFixed(2);
  const retroStr = values.retrogradeISCOVal.toFixed(2);
  const effStr = String(values.accretionEfficiency);

  if (audience === 'school') {
    return (
      `При текущем спине a* = ${values.spinA.toFixed(2)} попутный диск прижимается к дыре до ${proStr} r_s, а встречный отбрасывается на ${retroStr} r_s. ` +
      `Проваливаясь так глубоко в гравитационную яму по устойчивым орбитам, трение газа в попутном диске высвечивает в космос рекордные ${effStr}% массы покоя (вплоть до 42.3% при a* → 1 — это в 60 раз эффективнее термоядерного синтеза в ядре Солнца!).`
    );
  }

  return (
    `Аналитический корень r_ISCO = ½r_s[3 + Z_2 ∓ √((3 - Z_1)(3 + Z_1 + 2Z_2))] при a* = ${values.spinA.toFixed(2)} даёт r_ISCO(-) = ${proStr} r_s (prograde) и r_ISCO(+) = ${retroStr} r_s (retrograde). ` +
    `Радиационный КПД тонкого диска Новикова — Торна η = 1 - E(r_ISCO)/mc² достигает сейчас ${effStr}% mc² (предел при a* → 1 равен 1 - 1/√3 ≈ 42.26% против 5.72% у Шварцшильда и 3.77% для экстремальной ретроградной орбиты).`
  );
}

// ==========================================
// ГЛАВА В: РЕЛЯТИВИСТСКИЕ ДЖЕТЫ (БЛЭНДФОРД — ЗНАЕК)
// ==========================================

export const JETS_TITLE = 'Механизм Блэндфорда — Знаека: как запустить джет из эргосферы?';

export function getJetsIntro(audience: AudienceLevel, values?: LectureValues): string {
  const powerInfo = values ? ` (текущая мощность P_BZ = ${values.jetPowerVal}%)` : '';
  if (audience === 'school') {
    return (
      'Как чёрная дыра, которая должна всё поглощать, выстреливает узкие лучи плазмы (джеты) на сотни тысяч световых лет со скоростью 99.9% скорости света? ' +
      'Секрет в том, что плазма вылетает НЕ из-под горизонта событий, а из эргосферы снаружи него! Горячий аккреционный диск приносит мощное магнитное поле B. Вращающееся пространство эргосферы наматывает магнитные линии на полюса дыры, как спагетти на вилку, скручивая их в две тугие магнитные пружины, которые выстреливают плазму вверх и вниз' +
      powerInfo +
      '.'
    );
  }
  return (
    'В рамках релятивистской бессиловой электродинамики (F_μν J^ν = 0, механизм Блэндфорда — Знаека, 1977) полоидальные силовые линии магнитного поля B_p, удерживаемые плазмой диска и пронизывающие эргосферу, закручиваются увлечением инерциальных систем (вращение горизонта с частотой Ω_H = a·c / 2r_+). ' +
    'Горизонт работает как униполярный индуктор Фарадея с ЭДС ΔV ~ Ω_H Φ_BH / c ~ 10²⁰ В, вызывая каскадное рождение электрон-позитронных пар (e⁻e⁺) и генерируя коллимированный поток электромагнитного вектора Пойнтинга вдоль оси вращения: P_BZ = (κ/4πc) Φ_BH² Ω_H² ∝ a*² · B² · M²' +
    powerInfo +
    '. В режиме магнитно-запертого диска (MAD) мощность джета может превышать 100% мощности аккреции M_dot·c², напрямую откачивая энергию вращения самой чёрной дыры.'
  );
}

// ==========================================
// ИНТЕРАКТИВНЫЙ РЕНТГЕН УРАВНЕНИЙ
// ==========================================

export const FORMULA_XRAY_CAPTION = 'Интерактивный рентген ключевых соотношений (кликните)';

export const FORMULA_BUTTONS: {
  id: Exclude<FormulaTerm, null>;
  label: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: 'gtphi',
    label: '1. Сцепление времени и угла: g_tφ = -(r_s · r · a · sin²θ) / ρ²',
    activeClass: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200',
    idleClass: 'bg-slate-950 border-slate-800 text-indigo-300 hover:border-slate-700',
  },
  {
    id: 'ergo',
    label: '2. Горизонт и Эргосфера: r_+ = ½r_s(1 + √(1 - a*²)) ≤ r_ergo(θ)',
    activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-200',
    idleClass: 'bg-slate-950 border-slate-800 text-amber-300 hover:border-slate-700',
  },
  {
    id: 'bz_power',
    label: '3. Мощность джета (Блэндфорд — Знаек): P_BZ ∝ a*² · B² · r_s² · c',
    activeClass: 'bg-sky-500/20 border-sky-500/50 text-sky-200',
    idleClass: 'bg-slate-950 border-slate-800 text-sky-300 hover:border-slate-700',
  },
];

export const FORMULA_PLACEHOLDER =
  '👆 Нажмите на любое из трёх соотношений выше, чтобы увидеть его физический смысл (для школы и вуза) и текущие численные значения.';

export function getFormulaExplanation(
  term: FormulaTerm,
  values: LectureValues,
  audience: AudienceLevel = 'university'
): string {
  if (!term) return FORMULA_PLACEHOLDER;

  const aStr = values.spinA.toFixed(2);
  const rPlusStr = values.rPlusVal.toFixed(2);
  const jetStr = String(values.jetPowerVal);

  if (term === 'gtphi') {
    return audience === 'school'
      ? `Слагаемое g_tφ связывает время dt и поворот угла dφ. Именно из-за него вокруг дыры возникает водоворот пространства, который наматывает магнитные линии в тугую спираль (при a* = ${aStr} вихрь ${values.spinA === 0 ? 'выключен' : 'активен'}).`
      : `Недиагональная компонента метрики Бойера — Линдквиста g_tφ = -(r_s·r·a·sin²θ)/ρ² определяет угловую скорость увлечения систем отсчёта ω = -g_tφ/g_φφ и частоту вращения горизонта Ω_H = c·a*/(2r_+), создающую тороидальное магнитное поле B_φ из полоидального B_p.`;
  }

  if (term === 'ergo') {
    return audience === 'school'
      ? `При текущем спине a* = ${aStr} горизонт событий сжался до ${rPlusStr} r_s, открыв между ${rPlusStr} r_s и 1.00 r_s рабочую зону эргосферы, откуда магнитное поле черпает энергию вращения дыры.`
      : `При спине a* = ${aStr} корень Δ(r) = 0 фиксирует горизонт на r_+ = ${rPlusStr} r_s, а поверхность предела статичности g_tt = 0 лежит на r_ergo(π/2) = 1.00 r_s. Зазор r_ergo - r_+ = ${(1 - values.rPlusVal).toFixed(2)} r_s образует активную зону электродинамического извлечения энергии.`;
  }

  return audience === 'school'
    ? `Мощность релятивистского джета зависит от КВАДРАТА вращения дыры (a*²) и КВАДРАТА магнитного поля (B²). Если остановить вращение (a* = 0) или убрать магнитное поле (B = 0), джет мгновенно гаснет! Сейчас мощность P_BZ = ${jetStr}%.`
    : `Поток вектора Пойнтинга Блэндфорда — Знаека P_BZ = (κ/4πc) Φ_BH² Ω_H² при согласовании импедансов (Ω_F = ½Ω_H) масштабируется как a*² · B² · M². При текущих параметрах (и режиме MAD = ${values.madState ? 'ВКЛ' : 'ВЫКЛ'}) приведённая мощность составляет ${jetStr}%.`;
}

// ==========================================
// ПРАКТИКУМ: ЗАДАЧА 1 И ЗАДАЧА 2
// ==========================================

export const TASK1: TaskData = {
  id: 'task1',
  badge: 'Задача 1 · Базовая проверка',
  hintButton: 'Подсказка',
  question:
    'Почему у статичной чёрной дыры Шварцшильда (a* = 0) не работает механизм запуска джетов Блэндфорда — Знаека?',
  hint: 'Вспомните формулу P_BZ ∝ a*² · B²: без эргосферы и увлечения пространства (g_tφ = 0) магнитные линии не скручиваются в тороидальную пружину и не создают униполярную ЭДС.',
  options: [
    { id: 'a', label: 'У чёрной дыры Шварцшильда отсутствует горизонт событий', correct: false },
    { id: 'b', label: 'При a* = 0 исчезает эргосфера (g_tφ = 0) и прекращается релятивистское скручивание силовых линий магнитного поля', correct: true },
    { id: 'c', label: 'Магнитное поле полностью исчезает в вакууме вокруг любой массы', correct: false },
  ],
};

export const TASK2: TaskData = {
  id: 'task2',
  badge: 'Задача 2 · Калибровка квазара M87*',
  hintButton: 'Условие',
  description:
    'Настройте систему ползунками так, чтобы внутренняя граница попутного диска прижалась к горизонту до R_ISCO ≤ 1.25 r_s, а мощность джета P_BZ достигла ≥ 75%.',
  hint: 'Включите попутное вращение диска (Prograde), установите спин вращения a* ≥ 0.78 и поднимите магнитное поле B ≥ 0.90 (или активируйте режим MAD).',
  targetISCO: 1.25,
  maxISCO: 1.25, 
  targetJetPower: 75,
  minJetPower: 75,
  getSuccessText: (isco: number, power: number) =>
    `Режим квазара M87* достигнут! Граница ISCO сжата до ${isco.toFixed(2)} r_s, мощность джета P_BZ = ${power}%.`,
  getPendingText: (isco: number, power: number) =>
    `Цель: R_ISCO ≤ 1.25 r_s (сейчас ${isco.toFixed(2)} r_s) и P_BZ ≥ 75% (сейчас ${power}%).`,
};