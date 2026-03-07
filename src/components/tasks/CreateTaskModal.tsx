import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LaTeXPreview } from '@/components/ui/LaTeX';
import { X, Eye, Upload, FileText, Plus, Trash2, ImagePlus, UploadCloud } from 'lucide-react';
import api from '@/lib/axios';
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

  const [egeNumber, setEgeNumber] = useState<number>(1);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('MEDIUM');
  const [content, setContent] = useState('');
  const [solution, setSolution] = useState('');
  const [answer, setAnswer] = useState('');

  // Изображения
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrls((prev) => [...prev, response.data.url]);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Неизвестная ошибка сервера';
      alert(`Ошибка при загрузке: ${errorMsg}`);
      console.error('Детали ошибки:', error);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isValid = content.trim() && answer.trim() && topic;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Модальное окно с правильной структурой (Header -> Scrollable Body -> Footer) */}
      <div className="relative w-full max-w-4xl max-h-full flex flex-col bg-white rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Шапка */}
        <div className="shrink-0 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between z-20">
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

        {/* Скроллируемая область с кастомным скроллбаром */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 px-8 py-6">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
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

          {activeTab === 'latex' ? (
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
                <Button variant="outline" onClick={() => setLatexInput(LATEX_TEMPLATE)}>
                  Вставить пример
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select
                    label="Номер задания"
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: String(i + 1),
                      label: `Задание ${i + 1}`,
                    }))}
                    value={String(egeNumber)}
                    onChange={(val) => {
                      setEgeNumber(parseInt(val));
                      setTopic('');
                    }}
                  />
                </div>

                <div>
                  <Select
                    label="Тема"
                    options={[
                      { value: '', label: 'Выберите тему...' },
                      ...availableTopics.map((t) => ({ value: t, label: t })),
                    ]}
                    value={topic}
                    onChange={(val) => setTopic(val)}
                  />
                </div>

                <div>
                  <Select
                    label="Сложность"
                    options={Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    value={difficulty}
                    onChange={(val) => setDifficulty(val as TaskDifficulty)}
                  />
                </div>
              </div>

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
                  <LaTeXPreview content={content} label="Предпросмотр условия" className="mt-2" />
                )}
              </div>

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
                  <LaTeXPreview content={solution} label="Предпросмотр решения" className="mt-2" />
                )}
              </div>

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

              {/* Улучшенный блок загрузки изображений */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Изображения к задаче
                </label>
                <div className="space-y-3">
                  {imageUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="w-12 h-12 shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img
                          src={url}
                          alt={`Изображение ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Если ссылка битая, показываем красивую заглушку, а не прячем блок
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/100x100/f8fafc/94a3b8?text=Error';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 truncate">{url}</p>
                      </div>
                      <button
                        onClick={() => removeImageUrl(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 flex gap-2 w-full">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ImagePlus size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/image.png"
                          className="w-full h-[42px] pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addImageUrl();
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addImageUrl}
                        disabled={!newImageUrl.trim()}
                      >
                        Добавить
                      </Button>
                    </div>

                    <span className="text-slate-300 text-sm font-medium hidden sm:block">или</span>

                    <div className="w-full sm:w-auto">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        <UploadCloud size={16} className="mr-2" />
                        {isUploadingImage ? 'Загрузка...' : 'Загрузить файл'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="shrink-0 bg-slate-50/80 border-t border-slate-100 px-8 py-4 flex items-center justify-between z-20">
          <p className="text-sm text-slate-400">
            Поля со <span className="text-red-400">*</span> обязательны
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Добавить задачу'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
