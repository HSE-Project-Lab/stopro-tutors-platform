import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const aiRecommendations: any[] = [];
import {
  Brain,
  Upload,
  Camera,
  Sparkles,
  XCircle,
  Lightbulb,
  FileImage,
} from 'lucide-react';

export function AIAssistantPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    recognized: string;
    errors: { type: string; description: string }[];
    score: number;
    recommendations: string[];
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        simulateAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setAnalysisResult({
      recognized: `Дано: cos(2x) + sin²(x) = 0.5
      
Решение:
1 - 2sin²(x) + sin²(x) = 0.5
1 - sin²(x) = 0.5
sin²(x) = 0.5
sin(x) = ±√2/2

Ответ: x = π/4 + πn, n ∈ Z`,
      errors: [
        {
          type: 'CALCULATION',
          description: 'Неправильно применена формула двойного угла. cos(2x) = 1 - 2sin²(x), но в решении потеряно слагаемое.',
        },
        {
          type: 'CONCEPT',
          description: 'В ответе указаны не все серии решений. Пропущен случай sin(x) = -√2/2.',
        },
      ],
      score: 1,
      recommendations: [
        'Повторите формулы двойного угла для тригонометрических функций',
        'Обратите внимание на знак ± при извлечении корня',
        'Проверяйте подстановкой хотя бы одного корня',
      ],
    });
    setIsAnalyzing(false);
  };

  const clearAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
          <Brain size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ИИ-ассистент</h1>
          <p className="text-slate-500">
            Загрузите фото решения для анализа ошибок
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card padding="lg">
          <CardHeader
            title="Загрузить решение"
            subtitle="Поддерживаются JPG, PNG до 10 МБ"
          />

          {!uploadedImage ? (
            <label className="block">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-indigo-50 rounded-full mb-4">
                    <Upload size={32} className="text-indigo-600" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">
                    Перетащите файл или нажмите для выбора
                  </p>
                  <p className="text-sm text-slate-500">
                    Фото рукописного или печатного решения
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Загруженное решение"
                  className="w-full rounded-xl border border-slate-200"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="font-medium text-slate-900">Анализируем решение...</p>
                      <p className="text-sm text-slate-500">Это займёт несколько секунд</p>
                    </div>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={clearAnalysis} className="w-full">
                Загрузить другое
              </Button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1">
              <Camera size={18} className="mr-2" />
              Камера
            </Button>
            <Button variant="outline" className="flex-1">
              <FileImage size={18} className="mr-2" />
              Галерея
            </Button>
          </div>
        </Card>

        
        <div className="space-y-6">
          {analysisResult ? (
            <>
              
              <Card>
                <CardHeader
                  title="Распознанный текст"
                  action={
                    <Badge variant="success">
                      <Sparkles size={12} className="mr-1" />
                      OCR
                    </Badge>
                  }
                />
                <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {analysisResult.recognized}
                </pre>
              </Card>

              
              <Card>
                <CardHeader
                  title="Найденные ошибки"
                  subtitle={`${analysisResult.errors.length} ошибок обнаружено`}
                />
                <div className="space-y-3">
                  {analysisResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 rounded-xl border-l-4 border-red-500"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle size={16} className="text-red-600" />
                        <span className="font-medium text-red-900">
                          {error.type === 'CALCULATION'
                            ? 'Вычислительная ошибка'
                            : error.type === 'CONCEPT'
                            ? 'Концептуальная ошибка'
                            : error.type}
                        </span>
                      </div>
                      <p className="text-sm text-red-800">{error.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              
              <Card>
                <CardHeader title="Рекомендации" />
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl"
                    >
                      <Lightbulb size={18} className="text-indigo-600 mt-0.5" />
                      <p className="text-sm text-indigo-900">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>

              
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <div className="text-center py-4">
                  <p className="text-slate-400 mb-2">Оценка решения</p>
                  <p className="text-5xl font-bold">{analysisResult.score}/2</p>
                  <p className="text-slate-400 mt-2">баллов</p>
                </div>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
                  <Brain size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-500">
                  Загрузите решение для получения анализа
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      
      <Card>
        <CardHeader
          title="Персональные рекомендации"
          subtitle="На основе истории ваших решений"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-purple-600" />
                <Badge
                  variant={
                    rec.priority === 'HIGH'
                      ? 'danger'
                      : rec.priority === 'MEDIUM'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  {rec.priority === 'HIGH'
                    ? 'Важно'
                    : rec.priority === 'MEDIUM'
                    ? 'Средний'
                    : 'Низкий'}
                </Badge>
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{rec.title}</h4>
              <p className="text-sm text-slate-600">{rec.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
