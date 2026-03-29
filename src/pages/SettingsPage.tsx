import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import {
  User,
  Mail,
  Phone,
  Lock,
  Palette,
  Shield,
  Download,
  Trash2,
  Save,
  Camera,
  CheckCircle,
  Trophy,
  Star,
} from 'lucide-react';

interface StudentAchievementDto {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  receivedAt?: string;
  progressValue?: number;
  targetValue?: number;
  unlocked?: boolean;
}

type UiTheme = 'light' | 'dark' | 'auto';
type UiTextSize = 'small' | 'medium' | 'large';

const UI_THEME_STORAGE_KEY = 'uiTheme';
const UI_TEXT_SIZE_STORAGE_KEY = 'uiTextSize';

const applyThemePreference = (theme: UiTheme) => {
  if (typeof window === 'undefined') {
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  document.documentElement.classList.toggle('theme-dark', useDark);
};

const applyTextSizePreference = (size: UiTextSize) => {
  if (typeof window === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-text-size', size);
};

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const [activeSection, setActiveSection] = useState(isStudent ? 'appearance' : 'profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uiTheme, setUiTheme] = useState<UiTheme>('auto');
  const [textSize, setTextSize] = useState<UiTextSize>('medium');
  const [achievements, setAchievements] = useState<StudentAchievementDto[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    setIsSaving(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleExportData = () => {
    alert('Экспорт данных начат. PDF-файл будет скачан автоматически.');
  };

  const sections = [
    ...(!isStudent ? [{ id: 'profile', label: 'Профиль', icon: User }] : []),
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    ...(isStudent ? [{ id: 'achievements', label: 'Мои достижения', icon: Trophy }] : []),
    ...(!isStudent ? [{ id: 'security', label: 'Безопасность', icon: Lock }] : []),
    ...(!isStudent ? [{ id: 'data', label: 'Данные', icon: Download }] : []),
  ];

  useEffect(() => {
    setActiveSection(isStudent ? 'appearance' : 'profile');
  }, [isStudent]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedTheme = localStorage.getItem(UI_THEME_STORAGE_KEY) as UiTheme | null;
    const savedTextSize = localStorage.getItem(UI_TEXT_SIZE_STORAGE_KEY) as UiTextSize | null;

    const nextTheme =
      savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto'
        ? savedTheme
        : 'auto';
    const nextTextSize =
      savedTextSize === 'small' || savedTextSize === 'medium' || savedTextSize === 'large'
        ? savedTextSize
        : 'medium';

    setUiTheme(nextTheme);
    setTextSize(nextTextSize);

    applyThemePreference(nextTheme);
    applyTextSizePreference(nextTextSize);
  }, []);

  useEffect(() => {
    applyThemePreference(uiTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UI_THEME_STORAGE_KEY, uiTheme);
    }
  }, [uiTheme]);

  useEffect(() => {
    applyTextSizePreference(textSize);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UI_TEXT_SIZE_STORAGE_KEY, textSize);
    }
  }, [textSize]);

  useEffect(() => {
    if (typeof window === 'undefined' || uiTheme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemePreference('auto');
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [uiTheme]);

  useEffect(() => {
    if (!isStudent) {
      setAchievements([]);
      return;
    }

    let isMounted = true;

    const loadAchievements = async () => {
      setAchievementsLoading(true);
      try {
        const response = await api.get<StudentAchievementDto[]>('/student/achievements');
        if (!isMounted) {
          return;
        }
        setAchievements(response.data ?? []);
      } catch {
        if (!isMounted) {
          return;
        }
        setAchievements([]);
      } finally {
        if (isMounted) {
          setAchievementsLoading(false);
        }
      }
    };

    void loadAchievements();

    return () => {
      isMounted = false;
    };
  }, [isStudent]);

  return (
    <div className="app-settings-page space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>
        <p className="text-slate-500 mt-1">Управление аккаунтом и персонализация</p>
      </div>

      {showSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle size={20} />
          <span>Настройки сохранены!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card padding="sm">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`settings-section-button w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <section.icon size={18} />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {activeSection === 'profile' && !isStudent && (
            <Card>
              <CardHeader title="Личные данные" subtitle="Информация о вашем профиле" />

              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg hover:bg-slate-50 transition-colors">
                    <Camera size={16} className="text-slate-600" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-slate-500">{user?.email}</p>
                  <Badge variant={user?.role === 'TEACHER' ? 'info' : 'success'} className="mt-2">
                    {user?.role === 'TEACHER' ? 'Учитель' : 'Ученик'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Имя"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  icon={<User size={18} />}
                />
                <Input
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  icon={<User size={18} />}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  icon={<Mail size={18} />}
                />
                <Input
                  label="Телефон"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                  icon={<Phone size={18} />}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} isLoading={isSaving}>
                  <Save size={18} className="mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'achievements' && isStudent && (
            <Card>
              <CardHeader
                title="Мои достижения"
                subtitle="Трофеи и ачивки, которые ты уже заработал"
              />

              {achievementsLoading ? (
                <p className="text-slate-600">Загружаем достижения…</p>
              ) : achievements.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="achievement-star-empty p-2 rounded-lg bg-slate-200 text-slate-500">
                      <Star size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Пока нет достижений</h4>
                      <p className="text-sm text-slate-600">
                        Решай задачи ежедневно — первые трофеи появятся совсем скоро.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-xl border ${
                        achievement.unlocked
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            achievement.unlocked
                              ? 'bg-amber-100 text-amber-700'
                              : 'achievement-star-locked bg-slate-200 text-slate-500'
                          }`}
                        >
                          {achievement.unlocked ? <Trophy size={18} /> : <Star size={18} />}
                        </div>
                        <div className="w-full">
                          <h4 className="font-semibold text-slate-900">{achievement.title}</h4>
                          <p className="text-sm text-slate-600">{achievement.description}</p>

                          {typeof achievement.progressValue === 'number' &&
                          typeof achievement.targetValue === 'number' &&
                          achievement.targetValue > 0 ? (
                            <div className="mt-3 space-y-1">
                              <ProgressBar
                                value={Math.min(achievement.progressValue, achievement.targetValue)}
                                max={achievement.targetValue}
                                color={achievement.unlocked ? 'success' : 'primary'}
                                size="sm"
                              />
                              <p className="text-xs text-slate-500">
                                Прогресс: {achievement.progressValue}/{achievement.targetValue}
                              </p>
                            </div>
                          ) : null}

                          <p
                            className={`text-xs mt-2 font-medium ${
                              achievement.unlocked ? 'text-amber-700' : 'text-slate-500'
                            }`}
                          >
                            {achievement.unlocked ? 'Получено' : 'В процессе'}
                            {achievement.receivedAt
                              ? ` · ${new Date(achievement.receivedAt).toLocaleDateString('ru-RU')}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeSection === 'security' && !isStudent && (
            <Card>
              <CardHeader title="Безопасность" subtitle="Пароль и настройки входа" />

              <div className="space-y-4 max-w-md">
                <Input
                  label="Текущий пароль"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  icon={<Lock size={18} />}
                />
                <Input
                  label="Новый пароль"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  icon={<Lock size={18} />}
                />
                <Input
                  label="Подтверждение пароля"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  icon={<Lock size={18} />}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-indigo-600" />
                    <div>
                      <p className="font-medium text-slate-900">Двухфакторная аутентификация</p>
                      <p className="text-sm text-slate-500">Дополнительная защита аккаунта</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Включить
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => alert('Пароль обновлён')}>Изменить пароль</Button>
              </div>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader
                title="Внешний вид"
                subtitle={
                  isStudent
                    ? 'Личные данные и учебные параметры задаёт учитель. Здесь можно настроить только интерфейс.'
                    : 'Персонализация интерфейса'
                }
              />

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Тема оформления</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        id: 'light',
                        label: 'Светлая',
                        colors: 'theme-preview-light bg-white border-2 border-indigo-500',
                      },
                      { id: 'dark', label: 'Тёмная', colors: 'bg-slate-800' },
                      {
                        id: 'auto',
                        label: 'Системная',
                        colors: 'bg-gradient-to-r from-white to-slate-800',
                      },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setUiTheme(theme.id as UiTheme)}
                        className={`p-4 rounded-xl border-2 hover:border-indigo-300 transition-colors ${uiTheme === theme.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                      >
                        <div className={`w-full h-16 rounded-lg mb-2 ${theme.colors}`} />
                        <p className="text-sm font-medium text-slate-700">{theme.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Размер текста</h4>
                  <Select
                    options={[
                      { value: 'small', label: 'Маленький' },
                      { value: 'medium', label: 'Средний' },
                      { value: 'large', label: 'Большой' },
                    ]}
                    value={textSize}
                    onChange={(value) => setTextSize(value as UiTextSize)}
                  />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'data' && !isStudent && (
            <Card>
              <CardHeader title="Данные и экспорт" subtitle="Управление вашими данными" />

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download size={24} className="text-indigo-600" />
                    <div>
                      <p className="font-medium text-slate-900">Экспорт статистики</p>
                      <p className="text-sm text-slate-500">Скачать PDF-отчёт о вашем прогрессе</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    Скачать PDF
                  </Button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download size={24} className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">Экспорт всех данных</p>
                      <p className="text-sm text-slate-500">
                        Скачать все ваши данные в JSON формате
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => alert('Экспорт данных начат')}>
                    Скачать
                  </Button>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <div className="p-4 bg-red-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trash2 size={24} className="text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Удаление аккаунта</p>
                        <p className="text-sm text-red-600">Это действие нельзя отменить</p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (
                          confirm(
                            'Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.'
                          )
                        ) {
                          alert('Запрос на удаление отправлен');
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
