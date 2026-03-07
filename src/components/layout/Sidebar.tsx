import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  Brain,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { UserRole } from '@/types';

const adminNavItems = [
  { id: 'admin', label: 'Админ-панель', icon: ShieldAlert },
  { id: 'tasks', label: 'База задач', icon: BookOpen },
];

const teacherNavItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'students', label: 'Ученики и группы', icon: Users },
  { id: 'homework', label: 'Домашние задания', icon: ClipboardList },
  { id: 'tasks', label: 'База задач', icon: BookOpen },
  { id: 'analytics', label: 'Аналитика и отчёты', icon: BarChart3 },
];

const studentNavItems = [
  { id: 'dashboard', label: 'Мой прогресс', icon: LayoutDashboard },
  { id: 'practice', label: 'Практика', icon: BookOpen },
  { id: 'homework', label: 'Домашние задания', icon: ClipboardList },
  { id: 'ai-assistant', label: 'ИИ-помощник', icon: Brain },
  { id: 'analytics', label: 'Статистика', icon: BarChart3 },
];

const getNavItemsByRole = (role?: UserRole) => {
  if (role === 'ADMIN') return adminNavItems;
  if (role === 'TEACHER') return teacherNavItems;
  return studentNavItems;
};

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeTab, setActiveTab } = useAppStore();
  const { user, logout } = useAuthStore();

  const navItems = getNavItemsByRole(user?.role);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-100 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-lg">С</span>
          </div>
          {sidebarOpen && <span className="font-bold text-xl text-slate-900">СТОПРО</span>}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              activeTab === item.id || (activeTab === 'dashboard' && item.id === 'admin')
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            activeTab === 'settings'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Settings size={20} />
          {sidebarOpen && <span className="font-medium text-sm">Настройки</span>}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium text-sm">Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
