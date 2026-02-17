import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Palette,
  Shield,
  Download,
  Trash2,
  Save,
  Camera,
  CheckCircle,
} from 'lucide-react';

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailHomework: true,
    emailResults: true,
    emailWeekly: false,
    pushHomework: true,
    pushResults: true,
  });

  const handleSave = async () => {
    setIsSaving(true);

    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Lock },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'data', label: 'Данные', icon: Download },
  ];

  return (
    <div className="space-y-6">
      
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
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
          
          {activeSection === 'profile' && (
            <Card>
              <CardHeader 
                title="Личные данные" 
                subtitle="Информация о вашем профиле"
              />
              
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  icon={<User size={18} />}
                />
                <Input
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  icon={<User size={18} />}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  icon={<Mail size={18} />}
                />
                <Input
                  label="Телефон"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                  icon={<Phone size={18} />}
                />
              </div>

              {user?.role === 'STUDENT' && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="font-medium text-slate-900 mb-4">Настройки обучения</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Класс"
                      options={[
                        { value: '10', label: '10 класс' },
                        { value: '11', label: '11 класс' },
                      ]}
                      defaultValue="11"
                    />
                    <Input
                      label="Целевой балл ЕГЭ"
                      type="number"
                      defaultValue="85"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} isLoading={isSaving}>
                  <Save size={18} className="mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            </Card>
          )}

          
          {activeSection === 'security' && (
            <Card>
              <CardHeader 
                title="Безопасность" 
                subtitle="Пароль и настройки входа"
              />
              
              <div className="space-y-4 max-w-md">
                <Input
                  label="Текущий пароль"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  icon={<Lock size={18} />}
                />
                <Input
                  label="Новый пароль"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  icon={<Lock size={18} />}
                />
                <Input
                  label="Подтверждение пароля"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                <Button onClick={() => alert('Пароль обновлён')}>
                  Изменить пароль
                </Button>
              </div>
            </Card>
          )}

          
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader 
                title="Уведомления" 
                subtitle="Настройте способы получения уведомлений"
              />
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Email уведомления</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'emailHomework', label: 'Новые домашние задания' },
                      { key: 'emailResults', label: 'Результаты проверки' },
                      { key: 'emailWeekly', label: 'Еженедельный отчёт' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <span className="text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Push уведомления</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'pushHomework', label: 'Напоминания о дедлайнах' },
                      { key: 'pushResults', label: 'Результаты решения задач' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <span className="text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }}>
                  Сохранить настройки
                </Button>
              </div>
            </Card>
          )}

          
          {activeSection === 'appearance' && (
            <Card>
              <CardHeader 
                title="Внешний вид" 
                subtitle="Персонализация интерфейса"
              />
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Тема оформления</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Светлая', colors: 'bg-white border-2 border-indigo-500' },
                      { id: 'dark', label: 'Тёмная', colors: 'bg-slate-800' },
                      { id: 'auto', label: 'Системная', colors: 'bg-gradient-to-r from-white to-slate-800' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        className={`p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 transition-colors ${theme.id === 'light' ? 'border-indigo-500' : ''}`}
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
                    defaultValue="medium"
                  />
                </div>
              </div>
            </Card>
          )}

          
          {activeSection === 'data' && (
            <Card>
              <CardHeader 
                title="Данные и экспорт" 
                subtitle="Управление вашими данными"
              />
              
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
                      <p className="text-sm text-slate-500">Скачать все ваши данные в JSON формате</p>
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
                        if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
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
