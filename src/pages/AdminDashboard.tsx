import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/axios';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

export function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.md')) {
        setFile(droppedFile);
        setUploadStatus('idle');
      } else {
        setUploadStatus('error');
        setErrorMessage('Пожалуйста, загрузите файл формата Markdown (.md)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/ege-tasks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('success');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadStatus('error');

      // Пытаемся вытащить сообщение об ошибке из разных мест
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      const networkMessage = error.message;

      setErrorMessage(
        backendMessage || networkMessage || 'Произошла неизвестная ошибка при загрузке файла'
      );

      // Выводим в консоль для дебага
      console.error('Upload Error Details:', error.response || error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Админ-панель</h1>
        <p className="text-slate-500 mt-1">Пакетная загрузка задач ЕГЭ в базу знаний</p>
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Загрузка Markdown-файла</h2>
          <p className="text-sm text-slate-500">
            Файл должен содержать YAML Frontmatter с метаданными и задачи, разделенные тремя
            дефисами (---).
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
            file
              ? 'border-indigo-300 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".md"
            className="hidden"
          />

          {!file ? (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <UploadCloud size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium mb-1">Нажмите или перетащите файл сюда</p>
              <p className="text-slate-500 text-sm">Поддерживается только формат .md</p>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {uploadStatus === 'success' && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-700">
            <CheckCircle size={20} />
            <p className="text-sm font-medium">Задачи успешно загружены и добавлены в базу!</p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? 'Загрузка...' : 'Загрузить в базу'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
