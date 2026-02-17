// src/components/tasks/CreateTaskModal.tsx

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LaTeXPreview } from '@/components/ui/LaTeX';
import {
  X,
  Eye,
  Upload,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  EGE_TOPICS,
  DIFFICULTY_LABELS,
  type EgeTaskCreateRequest,
  type TaskDifficulty,
} from '@/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: EgeTaskCreateRequest) => Promise<void>;
}

const LATEX_TEMPLATE = `% @number: 5
% @topic: Логарифмические уравнения
% @difficulty: MEDIUM

\\begin{task}
Решите уравнение $\\log_2(x+3) + \\log_2(x-1) = 3$.
\\end{task}

\\begin{solution}
ОДЗ: $x > 1$. По свойству логарифмов:
$\\log_2((x+3)(x-1)) = 3$, откуда $(x+3)(x-1) = 8$.
$x^2 + 2x - 11 = 0$, $x = -1 \\pm 2\\sqrt{3}$.
С учётом ОДЗ: $x = -1 + 2\\sqrt{3}$.
\\end{solution}

\\begin{answer}
-1+2\\sqrt{3}
\\end{answer}`;

type TabType = 'manual' | 'latex';

export function CreateTaskModal({ isOpen, onClose, onSubmit }: CreateTaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Поля формы
  const [egeNumber, setEgeNumber] = useState<number>(1);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('MEDIUM');
  const [content, setContent] = useState('');
  const [solution, setSolution] = useState('');
  const [answer, setAnswer] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // LaTeX-импорт
  const [latexInput, setLatexInput] = useState('');

  const availableTopics = EGE_TOPICS[egeNumber] || [];

  const resetForm = useCallback(() => {
    setEgeNumber(1);
    setTopic('');
    setDifficulty('MEDIUM');
    setContent('');
    setSolution('');
    setAnswer('');
    setImageUrls([]);
    setNewImageUrl('');
    setLatexInput('');
    setShowPreview(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseLatexTemplate = () => {
    const lines = latexInput.split('\n');

    // Парсим метаданные из комментариев
    for (const line of lines) {
      const numberMatch = line.match(/%\s*@number:\s*(\d+)/);
      const topicMatch = line.match(/%\s*@topic:\s*(.+)/);
      const difficultyMatch = line.match(/%\s*@difficulty:\s*(\w+)/);

      if (numberMatch) setEgeNumber(parseInt(numberMatch[1]));
      if (topicMatch) setTopic(topicMatch[1].trim());
      if (difficultyMatch) {
        const d = difficultyMatch[1].toUpperCase() as TaskDifficulty;
        if (['EASY', 'MEDIUM', 'HARD'].includes(d)) setDifficulty(d);
      }
    }

    // Парсим блоки
    const taskMatch = latexInput.match(/\\begin\{task\}([\s\S]*?)\\end\{task\}/);
    const solutionMatch = latexInput.match(/\\begin\{solution\}([\s\S]*?)\\end\{solution\}/);
    const answerMatch = latexInput.match(/\\begin\{answer\}([\s\S]*?)\\end\{answer\}/);

    if (taskMatch) setContent(taskMatch[1].trim());
    if (solutionMatch) setSolution(solutionMatch[1].trim());
    if (answerMatch) setAnswer(answerMatch[1].trim());

    setActiveTab('manual');
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !answer.trim() || !topic) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        egeNumber,
        topic,
        difficulty,
        content,
        solution: solution || undefined,
        answer,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = content.trim() && answer.trim() && topic;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
      {/* Оверлей */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Модальное окно */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-10">
        {/* Шапка */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Новая задача</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Добавьте задание ЕГЭ по профильной математике
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Табы */}
        <div className="px-8 pt-5">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Ручной ввод
            </button>
            <button
              onClick={() => setActiveTab('latex')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'latex'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Импорт LaTeX
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="px-8 py-6 space-y-6">
          {activeTab === 'latex' ? (
            /* ===== ТАБ ИМПОРТА ===== */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Вставьте LaTeX-шаблон от методиста
                </label>
                <textarea
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  placeholder={LATEX_TEMPLATE}
                  className="w-full h-72 px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={parseLatexTemplate} disabled={!latexInput.trim()}>
                  Распарсить и заполнить форму
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLatexInput(LATEX_TEMPLATE)}
                >
                  Вставить пример
                </Button>
              </div>
            </div>
          ) : (
            /* ===== ТАБ РУЧНОГО ВВОДА ===== */
            <div className="space-y-6">
              {/* Метаданные */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Номер задания
                  </label>
                  <Select
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: String(i + 1),
                      label: `Задание ${i + 1}`,
                    }))}
                    value={String(egeNumber)}
                    onChange={(e) => {
                      setEgeNumber(parseInt(e.target.value));
                      setTopic(''); // сброс темы при смене номера
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Тема
                  </label>
                  <Select
                    options={[
                      { value: '', label: 'Выберите тему...' },
                      ...availableTopics.map((t) => ({ value: t, label: t })),
                    ]}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Сложность
                  </label>
                  <Select
                    options={Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                  />
                </div>
              </div>

              {/* Условие */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Условие задачи <span className="text-red-400">*</span>
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Eye size={14} />
                    {showPreview ? 'Скрыть превью' : 'Показать превью'}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Введите условие задачи. Используйте $...$ для формул.&#10;&#10;Пример: Решите уравнение $2x + 3 = 7$."
                  className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {showPreview && (
                  <LaTeXPreview
                    content={content}
                    label="Предпросмотр условия"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Решение */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Решение (необязательно)
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Подробное решение задачи..."
                  className="w-full h-28 px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {showPreview && solution && (
                  <LaTeXPreview
                    content={solution}
                    label="Предпросмотр решения"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Ответ */}
              <div>
                <Input
                  label="Ответ *"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Правильный ответ (число или выражение)"
                />
                {showPreview && answer && (
                  <LaTeXPreview
                    content={`Ответ: $${answer}$`}
                    label="Предпросмотр ответа"
                    className="mt-2"
                  />
                )}
              </div>

              {/* Изображения */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Изображения (URL)
                </label>
                <div className="space-y-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 truncate">
                        {url}
                      </div>
                      <img
                        src={url}
                        alt={`Изображение ${index + 1}`}
                        className="w-10 h-10 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => removeImageUrl(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addImageUrl} disabled={!newImageUrl.trim()}>
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-4 rounded-b-2xl flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Поля со <span className="text-red-400">*</span> обязательны
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Добавить задачу'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}