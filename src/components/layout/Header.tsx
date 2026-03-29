import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Bell, Menu, Settings, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Header() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setActiveTab } = useAppStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <header
      className={cn(
        'app-header fixed top-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-100 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-20'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="text-sm text-slate-500">{getGreeting()},</p>
            <p className="font-semibold text-slate-900">{user?.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setUserMenuOpen(false);
              }}
              className="header-notifications-button relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Bell size={20} />
            </button>

            {notificationsOpen && (
              <div className="header-notifications-menu absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
                <p className="text-sm font-semibold text-slate-900 mb-1">Уведомления</p>
                <p className="text-sm text-slate-500">Пока нет уведомлений</p>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold hover:opacity-95 transition-opacity"
            >
              {(() => {
                const name = user?.fullName || '';
                if (!name) return '';
                return name
                  .split(' ')
                  .map((s) => s[0] || '')
                  .slice(0, 2)
                  .join('');
              })()}
            </button>

            {userMenuOpen && (
              <div className="header-user-menu absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setUserMenuOpen(false);
                  }}
                  className="header-user-menu-item w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings size={16} /> Настройки
                </button>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="header-user-menu-item danger w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
