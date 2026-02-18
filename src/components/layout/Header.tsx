import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Bell, Search, Menu } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Header() {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-slate-100 transition-all duration-300',
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
          <div className="relative hidden md:block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск задач, учеников..."
              className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold">
            {(() => {
              const name = user?.fullName || '';
              if (!name) return '';
              return name
                .split(' ')
                .map((s) => s[0] || '')
                .slice(0, 2)
                .join('');
            })()}
          </div>
        </div>
      </div>
    </header>
  );
}
