import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { TeacherDashboard } from '@/pages/TeacherDashboard';
import { TasksPage } from '@/pages/TasksPage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { HomeworkPage } from '@/pages/HomeworkPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const { user } = useAuthStore();
  const { activeTab } = useAppStore();

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
      case 'tasks':
      case 'practice':
        return <TasksPage />;
      case 'students':
        return <StudentsPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'homework':
        return <HomeworkPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return user.role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export function App() {
  return <AppContent />;
}
