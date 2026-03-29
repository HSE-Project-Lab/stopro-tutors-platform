import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { GraduationCap, BookOpen, Lock, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const { default: api } = await import('@/lib/axios');
      const response = await api.post('/auth/login', { username, password });

      const backendUser = response.data.user || {};
      const fullName = backendUser.fullName || backendUser.username || '';
      const [firstName = '', ...rest] = fullName.split(' ').filter(Boolean);
      const lastName = rest.join(' ');
      const normalizedUser = {
        ...backendUser,
        firstName,
        lastName,
        email: backendUser.email || backendUser.username || '',
      };

      login(normalizedUser as any, response.data.accessToken);
    } catch (error: any) {
      console.error('Login failed', error);
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;
      if (status === 401 || status === 403) {
        setAuthError('Неверный логин или пароль. Проверьте данные и попробуйте снова.');
      } else {
        setAuthError(backendMessage || 'Не удалось выполнить вход. Попробуйте ещё раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const firstName = prompt('Имя:');
    const lastName = prompt('Фамилия:');
    if (!firstName || !lastName) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    setIsLoading(true);
    try {
      const { default: api } = await import('@/lib/axios');
      const response = await api.post('/auth/register', {
        username,
        password,
        fullName,
        role: 'TEACHER',
      });

      const backendUser2 = response.data.user || {};
      const fullName2 = backendUser2.fullName || backendUser2.username || '';
      const [firstName2 = '', ...rest2] = fullName2.split(' ').filter(Boolean);
      const lastName2 = rest2.join(' ');
      const normalizedUser2 = {
        ...backendUser2,
        firstName: firstName2,
        lastName: lastName2,
        email: backendUser2.email || backendUser2.username || '',
      };
      login(normalizedUser2 as any, response.data.accessToken);
    } catch (error: any) {
      console.error('Register failed', error);
      alert(error.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'teacher' | 'student') => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const demoTeacher = {
      id: 't-demo',
      username: 'teacher_demo',
      fullName: 'Учитель Демонстрационный',
      role: 'TEACHER',
    };
    const demoStudent = {
      id: 's-demo',
      username: 'student_demo',
      fullName: 'Ученик Демонстрационный',
      role: 'STUDENT',
    };

    if (role === 'teacher') {
      login(demoTeacher as any, 'demo-token-teacher');
    } else {
      login(demoStudent as any, 'demo-token-student');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4">
            <span className="text-white font-bold text-3xl">С</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">СТОПРО</h1>
          <p className="text-slate-500 mt-2">Платформа для подготовки к профильной математике</p>
        </div>

        <Card padding="lg" className="shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Логин"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (authError) setAuthError(null);
              }}
              icon={<BookOpen size={18} />}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError(null);
              }}
              icon={<Lock size={18} />}
            />

            {authError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-in fade-in duration-200">
                <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Не удалось войти</p>
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="rounded border-slate-300" />
                Запомнить меня
              </label>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Забыли пароль?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Войти
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">или войти как</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('student')}
              className="flex-col h-auto py-4"
            >
              <BookOpen size={24} className="mb-2 text-indigo-600" />
              <span className="font-semibold">Ученик</span>
              <span className="text-xs text-slate-500">Демо-доступ</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('teacher')}
              className="flex-col h-auto py-4"
            >
              <GraduationCap size={24} className="mb-2 text-purple-600" />
              <span className="font-semibold">Учитель</span>
              <span className="text-xs text-slate-500">Демо-доступ</span>
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Нет аккаунта?{' '}
            <button
              type="button"
              onClick={handleRegister}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Зарегистрироваться как Учитель
            </button>
          </p>
        </Card>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="text-2xl mb-1">📚</div>
            <p className="text-xs text-slate-600">2000+ задач ЕГЭ</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs text-slate-600">ИИ-анализ ошибок</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-slate-600">Детальная аналитика</p>
          </div>
        </div>
      </div>
    </div>
  );
}
