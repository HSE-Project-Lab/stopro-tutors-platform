import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { TasksPage } from '@/pages/TasksPage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { TeacherAnalytics } from '@/pages/TeacherAnalytics';
import { TeacherTaskBank } from '@/pages/TeacherTaskBank';
import { StudentPractice } from '@/pages/StudentPractice';
import { HomeworkPage } from '@/pages/HomeworkPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { CrmPage } from '@/pages/CrmPage';

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

function AppContent() {
  const { user } = useAuthStore();
  const { activeTab, setActiveTab } = useAppStore();
  const previousRoleRef = useRef(user?.role);

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) {
      previousRoleRef.current = undefined;
      return;
    }

    if (previousRoleRef.current && previousRoleRef.current !== user.role) {
      setActiveTab('dashboard');
    }

    previousRoleRef.current = user.role;
  }, [user, setActiveTab]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!user) {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.setAttribute('data-text-size', 'medium');
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

    applyThemePreference(nextTheme);
    applyTextSizePreference(nextTextSize);

    if (nextTheme !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemePreference('auto');
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [user]);

  if (!user) {
    if (showLogin) {
      return (
        <div className="relative min-h-screen bg-slate-50">
          <button
            onClick={() => setShowLogin(false)}
            className="absolute top-6 left-6 text-slate-500 hover:text-slate-900 font-medium z-10 transition-colors"
          >
            ← На главную
          </button>
          <LoginPage />
        </div>
      );
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'admin':
        return user.role === 'ADMIN' ? <AdminDashboard /> : <TeacherDashboard />;
      case 'dashboard':
        if (user.role === 'ADMIN') return <AdminDashboard />;
        return user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
      case 'tasks':
        if (user.role === 'TEACHER') return <TeacherTaskBank />;
        if (user.role === 'ADMIN') return <TasksPage />;
        return <StudentPractice />;
      case 'practice':
        return user.role === 'STUDENT' ? <StudentPractice /> : <TeacherTaskBank />;
      case 'students':
        return user.role === 'TEACHER' ? <StudentsPage /> : <TeacherDashboard />;
      case 'ai-assistant':
        return user.role === 'TEACHER' ? <AIAssistantPage /> : <StudentDashboard />;
      case 'analytics':
        return user.role === 'TEACHER' ? (
          <TeacherAnalytics />
        ) : user.role === 'STUDENT' ? (
          <AnalyticsPage />
        ) : (
          <AdminDashboard />
        );
      case 'homework':
        return user.role === 'ADMIN' ? <AdminDashboard /> : <HomeworkPage />;
      case 'crm':
        return user.role === 'TEACHER' ? <CrmPage /> : <TeacherDashboard />;
      case 'settings':
        return <SettingsPage />;
      default:
        if (user.role === 'ADMIN') return <AdminDashboard />;
        return user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export function App() {
  return <AppContent />;
}
