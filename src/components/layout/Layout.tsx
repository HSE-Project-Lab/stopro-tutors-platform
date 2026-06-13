import { useAppStore } from '@/store/appStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 flex flex-col',
          sidebarOpen ? 'pl-64' : 'pl-20'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
