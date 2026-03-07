import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LaTeX } from '@/components/ui/LaTeX';
import api from '@/lib/axios';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import type { EgeTask, TaskDifficulty } from '@/types';
import { DIFFICULTY_LABELS } from '@/types';

export function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<EgeTask | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const difficultyVariant: Record<TaskDifficulty, 'success' | 'warning' | 'danger'> = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger',
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.md')) {
        await processFile(droppedFile);
      } else {
        setStatus('error');
        setErrorMessage('Пожалуйста, загрузите файл формата Markdown (.md)');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('parsing');
    setErrorMessage('');
    setPreviewData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post<EgeTask>('/ege-tasks/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(response.data);
      setStatus('idle');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Ошибка при чтении Markdown файла');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSave = async () => {
    if (!previewData) return;
    setStatus('saving');

    try {
      await api.post('/ege-tasks/batch', previewData);
      setStatus('success');
      setFile(null);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Ошибка при сохранении в базу данных');
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreviewData(null);
    setStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Админ-панель</h1>
        <p className="text-slate-500 mt-1">Пакетная загрузка задач ЕГЭ в базу знаний</p>
      </div>

      {!previewData && status !== 'success' && (
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Загрузка Markdown-файла</h2>
            <p className="text-sm text-slate-500">
              Файл должен содержать YAML Frontmatter и задачи, разделенные тремя дефисами (---).
            </p>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              status === 'parsing'
                ? 'border-indigo-300 bg-indigo-50/50 opacity-70 cursor-wait'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => status !== 'parsing' && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".md"
              className="hidden"
            />
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <UploadCloud size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium mb-1">
              {status === 'parsing' ? 'Чтение файла...' : 'Нажмите или перетащите файл сюда'}
            </p>
            <p className="text-slate-500 text-sm">Поддерживается только формат .md</p>
          </div>
        </Card>
      )}

      {previewData && status !== 'success' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-indigo-500" /> Предпросмотр перед сохранением
            </h2>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearAll} disabled={status === 'saving'}>
                Отменить
              </Button>
              <Button onClick={handleConfirmSave} disabled={status === 'saving'}>
                {status === 'saving' ? 'Сохранение...' : 'Подтвердить и добавить в базу'}
              </Button>
            </div>
          </div>

          <Card className="border-indigo-200 shadow-md shadow-indigo-100/50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <Badge
                  variant="outline"
                  className="mb-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  ПРОТОТИП
                </Badge>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">Задание {previewData.egeNumber}</Badge>
                  <Badge
                    variant="default"
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    {previewData.topic}
                  </Badge>
                  <Badge variant={difficultyVariant[previewData.difficulty]}>
                    {DIFFICULTY_LABELS[previewData.difficulty]}
                  </Badge>
                </div>
              </div>
            </div>

            <LaTeX className="text-slate-800 leading-relaxed text-lg">{previewData.content}</LaTeX>

            <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
              {previewData.solution && (
                <div className="mb-4 bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Решение</p>
                  <LaTeX className="text-sm text-slate-700">{previewData.solution}</LaTeX>
                </div>
              )}
              <p className="text-sm text-slate-600">
                🔑 Ответ:{' '}
                <span className="font-mono font-bold text-slate-900">{previewData.answer}</span>
              </p>
            </div>
          </Card>

          {previewData.variants && previewData.variants.length > 0 && (
            <div className="pl-8 border-l-2 border-indigo-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Распознано вариантов: {previewData.variants.length}
              </h3>
              {previewData.variants.map((variant, idx) => (
                <Card key={idx} padding="sm" className="bg-white/50 border-slate-200">
                  <Badge variant="outline" className="mb-3">
                    Вариант {idx + 1}
                  </Badge>
                  <LaTeX className="text-slate-800 leading-relaxed">{variant.content}</LaTeX>

                  <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                    {variant.solution && (
                      <div className="mb-3 bg-slate-50/50 p-2 rounded-md">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Решение</p>
                        <LaTeX className="text-sm text-slate-700">{variant.solution}</LaTeX>
                      </div>
                    )}
                    <p className="text-sm text-slate-600">
                      🔑 Ответ:{' '}
                      <span className="font-mono font-bold text-slate-900">{variant.answer}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <Card className="bg-emerald-50 border-emerald-200 text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-emerald-800 mb-2">Успешно сохранено!</h3>
          <p className="text-emerald-600 mb-6">
            Прототип и {previewData?.variants?.length || 0} вариантов добавлены в базу.
          </p>
          <Button onClick={clearAll} variant="outline" className="bg-white">
            Загрузить ещё один файл
          </Button>
        </Card>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
          <button onClick={clearAll} className="ml-auto p-1 hover:bg-red-100 rounded-md">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
