import { useState } from 'react';
import api from '@/lib/axios';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface CreateGroupChatModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupChatModal({ onClose, onSuccess }: CreateGroupChatModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [chatName, setChatName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async () => {
    if (!chatName.trim()) {
      setError('Введите название группы');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Выберите хотя бы одного ученика');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post('/chats/groups', {
        chatName,
        chatAvatarUrl: null,
        studentIds: selectedStudents,
        existingGroupId: null,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании группы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? 'Создать групповой чат' : 'Выбрать участников'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название группы
                </label>
                <input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Введите название группы"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Аватар группы (опционально)
                </label>
                <div className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <span className="text-gray-500 text-sm">👥</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Выберите учеников для добавления в группу
              </p>
              {/* Student list would go here */}
              <div className="text-gray-500 text-sm">
                {selectedStudents.length} учеников выбрано
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!chatName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleCreateGroup}
              disabled={loading || selectedStudents.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

