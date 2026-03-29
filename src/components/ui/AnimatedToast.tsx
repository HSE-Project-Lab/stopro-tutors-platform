import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message?: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
  children?: React.ReactNode;
  action?: ToastAction;
}

export function AnimatedToast({
  message,
  type,
  onClose,
  duration = 4000,
  children,
  action,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const isSuccess = type === 'success';
  const isInfo = type === 'info';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-[200] origin-bottom-right"
    >
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-50/90 border-emerald-200/50 text-emerald-800'
            : isInfo
              ? 'bg-indigo-50/90 border-indigo-200/50 text-indigo-800'
              : 'bg-red-50/90 border-red-200/50 text-red-800'
        }`}
      >
        {isSuccess ? (
          <CheckCircle size={22} className="text-emerald-500 shrink-0" />
        ) : isInfo ? (
          <Info size={22} className="text-indigo-500 shrink-0" />
        ) : (
          <AlertCircle size={22} className="text-red-500 shrink-0" />
        )}

        {children ? (
          <div className="flex-1">{children}</div>
        ) : (
          <p className="font-medium text-sm max-w-[300px] leading-snug">{message}</p>
        )}

        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`ml-2 px-3 py-1 rounded-xl text-sm font-medium border transition-colors shrink-0 ${
              isSuccess
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : isInfo
                  ? 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  : 'border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            {action.label}
          </button>
        )}

        <button
          onClick={onClose}
          className={`ml-2 p-1.5 rounded-xl transition-colors shrink-0 ${
            isSuccess ? 'hover:bg-emerald-100' : isInfo ? 'hover:bg-indigo-100' : 'hover:bg-red-100'
          }`}
        >
          <X size={16} className="opacity-70" />
        </button>
      </div>
    </motion.div>
  );
}
