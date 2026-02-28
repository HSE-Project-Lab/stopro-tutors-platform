import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Brain,
  CheckCircle,
  Play,
  Star,
  ChevronRight,
  TrendingUp,
  Shield,
  ScanSearch,
  Sparkles,
  FunctionSquare,
  BarChart,
  Smartphone,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';

const WORDS = ['время', 'нервы', 'силы', 'рутину'];

// ===== КОМПОНЕНТ "ФОНАРИК" ДЛЯ BENTO GRID =====
function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.06), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}

// ===== ДАННЫЕ ДЛЯ ШОУКЕЙСА =====
const SHOWCASE_TABS = [
  {
    id: 'base',
    title: 'База знаний и конструктор',
    desc: 'Формируйте домашние задания из тысяч готовых прототипов ЕГЭ. Встроенная поддержка LaTeX и изображений.',
    icon: Shield,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
  },
  {
    id: 'ai',
    title: 'Умный анализ ответов',
    desc: 'Платформа не просто сверяет ответ. ИИ читает рукописный ход решения ученика и находит логические ошибки.',
    icon: ScanSearch,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  {
    id: 'analytics',
    title: 'Абсолютный контроль',
    desc: 'Детальная аналитика по каждому ученику. Система подскажет, какие темы нужно повторить перед экзаменом.',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
];

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  // Анимация слов
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Плавная навигация
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }
  };

  // Параллакс главного экрана
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Логика авто-шоукейса
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 секунд на вкладку
    const interval = 50; // Обновление каждые 50мс
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveTab((current) => (current + 1) % SHOWCASE_TABS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeTab]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* НАВИГАЦИЯ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-lg">С</span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">СТОПРО</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <button onClick={() => scrollTo('showcase')} className="hover:text-indigo-600 transition-colors">Платформа</button>
            <button onClick={() => scrollTo('bento')} className="hover:text-indigo-600 transition-colors">Возможности</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-indigo-600 transition-colors">Тарифы</button>
          </div>
          <button
            onClick={onLoginClick}
            className="group relative px-6 py-2.5 rounded-full font-medium overflow-hidden bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-md hover:shadow-xl hover:shadow-indigo-200"
          >
            Вход для репетиторов
          </button>
        </div>
      </motion.nav>

      {/* ГЛАВНЫЙ ЭКРАН */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-100/50 blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-100/50 blur-[100px]"
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-8"
          >
            <Sparkles size={16} className="text-indigo-500" />
            <span>Платформа 2.0 с нейросетевым анализом</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
            Делегируйте <br className="hidden md:block" />
            <span className="text-indigo-600 inline-flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={WORDS[wordIndex]}
                  initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -20, opacity: 0, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="inline-block min-w-[280px] text-left ml-4"
                >
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl leading-relaxed"
          >
            Единая экосистема для репетиторов. Создавайте интерактивные задания, управляйте группами и экономьте часы на проверке благодаря AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={onLoginClick}
              className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Начать бесплатно <ChevronRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* БЕГУЩАЯ СТРОКА (MARQUEE) */}
      <div className="bg-indigo-600 text-white py-4 overflow-hidden flex whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="flex gap-8 text-lg font-medium tracking-wide"
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span>Профильная математика</span><span className="text-indigo-300">•</span>
              <span>Распознавание рукописного текста</span><span className="text-indigo-300">•</span>
              <span>Проверка оформления</span><span className="text-indigo-300">•</span>
              <span>Генерация вариантов</span><span className="text-indigo-300">•</span>
              <span>Умная аналитика</span><span className="text-indigo-300">•</span>
              <span>LaTeX Конструктор</span><span className="text-indigo-300">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* НОВЫЙ ИНТЕРАКТИВНЫЙ ШОУКЕЙС (ВМЕСТО SCROLLYTELLING) */}
      <section id="showcase" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">Как это работает</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Автоматизируйте весь цикл обучения: от создания задачи до анализа успеваемости.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Левая часть: Вкладки */}
            <div className="space-y-4">
              {SHOWCASE_TABS.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(idx);
                      setProgress(0);
                    }}
                    className={cn(
                      "relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2",
                      isActive ? "bg-white border-indigo-100 shadow-md scale-[1.02]" : "bg-transparent border-transparent hover:bg-slate-100"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isActive ? tab.bg : "bg-slate-200 text-slate-500", isActive && tab.color)}>
                        <tab.icon size={24} />
                      </div>
                      <div>
                        <h3 className={cn("text-xl font-bold mb-2 transition-colors", isActive ? "text-slate-900" : "text-slate-500")}>
                          {tab.title}
                        </h3>
                        <p className={cn("text-slate-600 transition-all duration-300 overflow-hidden", isActive ? "h-auto opacity-100" : "h-0 opacity-0")}>
                          {tab.desc}
                        </p>
                      </div>
                    </div>

                    {/* Полоска прогресса снизу */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 rounded-b-2xl transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Правая часть: Анимированные визуализации */}
            <div className="relative aspect-square md:aspect-[4/3] w-full bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 p-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div
                    key="tab0"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 font-mono text-sm flex flex-col gap-4"
                  >
                    <div className="flex gap-2 mb-2 border-b border-slate-100 pb-4">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-indigo-500 font-bold">\begin{'{task}'}</div>
                    <div className="pl-4 text-slate-700">Решите уравнение: $\log_2(x+3) = 3$</div>
                    <div className="text-indigo-500 font-bold">\end{'{task}'}</div>
                    <div className="mt-4 p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 font-sans text-center">
                      <span className="font-medium text-slate-900 text-lg">Решите уравнение: <span className="italic text-indigo-700">log₂ (x+3) = 3</span></span>
                    </div>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    key="tab1"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full max-w-sm h-[300px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <motion.div
                      animate={{ y: ["0%", "300%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,1)] z-10 top-0"
                    />
                    <div className="absolute inset-0 flex flex-col p-8 gap-4 justify-center">
                      <div className="w-full h-6 bg-white/10 rounded-md" />
                      <div className="w-3/4 h-6 bg-white/10 rounded-md" />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 }}
                        className="w-full p-3 border border-red-500/50 bg-red-500/10 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-red-400 text-xs font-mono">x² = 16 ➔ x = 4</span>
                        <span className="text-red-400 text-xs font-bold bg-red-500/20 px-2 py-1 rounded">Потерян корень -4</span>
                      </motion.div>
                      <div className="w-1/2 h-6 bg-white/10 rounded-md" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    key="tab2"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm h-[300px] bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex items-end gap-3 justify-center relative"
                  >
                    <div className="absolute top-6 left-6 text-slate-500 font-medium">Прогресс группы</div>
                    {[40, 70, 45, 90, 65, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                        className={cn("w-10 rounded-t-lg", i === 5 ? "bg-indigo-500" : "bg-emerald-400")}
                        style={{ opacity: 0.5 + (h / 200) }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO GRID */}
      <section id="bento" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">Всё для идеального урока</h2>
            <p className="text-lg text-slate-500">Мощные инструменты, упакованные в простой интерфейс.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Большая карточка */}
            <SpotlightCard className="md:col-span-2 md:row-span-2 p-10 bg-slate-50 flex flex-col justify-between group cursor-default">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                  <FunctionSquare size={28} className="text-indigo-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Нативный LaTeX Редактор</h3>
                <p className="text-lg text-slate-600 max-w-md">Вставляйте формулы, графики и системы уравнений. Платформа моментально рендерит их в красивый математический текст.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm font-mono text-sm text-slate-600 group-hover:border-indigo-300 transition-colors">
                Решите уравнение: <span className="text-indigo-600">\log_2(x+3) = 3</span>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-8 bg-slate-50 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <BarChart size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Глубокая статистика</h3>
              <p className="text-slate-600 text-sm">Процент решаемости по каждой теме ЕГЭ для точечной отработки.</p>
            </SpotlightCard>

            <SpotlightCard className="p-8 bg-slate-50 cursor-default">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                <Smartphone size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Мобильный формат</h3>
              <p className="text-slate-600 text-sm">Ученикам удобно решать задачи прямо со смартфона по дороге в школу.</p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* ОТЗЫВЫ */}
      <section className="py-32 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Проверено на практике</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Опыт тех, кто уже перешел на новый формат преподавания.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Анна Смирнова',
                role: 'Преподаватель математики',
                text: 'ИИ-ассистент — это магия. Он не просто говорит "неверно", он показывает ученику, где именно потерян минус. Мое время проверки сократилось в 4 раза.',
                video: true,
              },
              {
                name: 'Михаил Иванов',
                role: 'Репетитор по физике',
                text: 'Потрясающая база задач и невероятно стильный интерфейс. Ученикам нравится решать задания с телефона, а я вижу всю статистику в реальном времени.',
                video: false,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="group p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all"
              >
                {review.video && (
                  <div className="relative aspect-video bg-slate-100 rounded-2xl mb-8 overflow-hidden cursor-pointer border border-slate-200">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute inset-0 flex items-center justify-center z-10"
                    >
                      <div className="w-16 h-16 bg-white/80 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-slate-900">
                        <Play size={24} className="ml-1" />
                      </div>
                    </motion.div>
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" alt="Video cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                  </div>
                )}
                <div className="flex gap-1 mb-6 text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} size={20} fill="currentColor" />)}
                </div>
                <p className="text-xl text-slate-700 mb-8 leading-relaxed">«{review.text}»</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-lg text-slate-700">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">{review.name}</div>
                    <div className="text-slate-500">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ТАРИФЫ */}
      <section id="pricing" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Инвестиция в ваше время</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Один дополнительный ученик окупает подписку на год.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Базовый тариф */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-200 flex flex-col"
            >
              <h3 className="text-2xl font-bold mb-2 text-slate-900">Базовый</h3>
              <div className="text-slate-500 mb-8">Идеально для старта</div>
              <div className="text-5xl font-bold mb-10 text-slate-900">
                0 ₽ <span className="text-xl text-slate-500 font-medium">/ мес</span>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {['До 5 учеников', 'Конструктор ДЗ', 'База задач ЕГЭ', 'Ручная проверка'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-700 text-lg">
                    <CheckCircle size={24} className="text-slate-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={onLoginClick} className="w-full py-4 rounded-full font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm">
                Создать аккаунт
              </button>
            </motion.div>

            {/* Premium тариф */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-[2.5rem] bg-slate-900 text-white flex flex-col overflow-hidden shadow-2xl shadow-indigo-900/20"
            >
              <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-indigo-500/30 blur-[80px] rounded-full" />
              
              <div className="absolute top-0 right-8 bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-b-xl uppercase tracking-wider shadow-lg">
                Популярный
              </div>
              
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Zap className="text-amber-400 fill-amber-400" /> Premium
              </h3>
              <div className="text-slate-400 mb-8">ИИ-ассистент и безлимит</div>
              <div className="text-5xl font-bold mb-10">
                990 ₽ <span className="text-xl text-slate-400 font-medium">/ мес</span>
              </div>
              <ul className="space-y-5 mb-12 flex-1 relative z-10">
                {['Безлимитные ученики', 'ИИ-проверка ДЗ по фото', 'Генерация развернутых решений', 'Глубокая аналитика', 'Приоритетная поддержка'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-200 text-lg">
                    <CheckCircle size={24} className="text-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={onLoginClick} className="relative z-10 w-full py-4 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
                Попробовать Premium
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="py-12 border-t border-slate-200 text-slate-500 text-center relative z-10 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">С</div>
            <span className="font-bold text-xl tracking-tight">СТОПРО</span>
          </div>
          <p>© {new Date().getFullYear()} Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}