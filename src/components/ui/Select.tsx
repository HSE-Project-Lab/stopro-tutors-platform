import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  error,
  placeholder = 'Выберите...',
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const hasValue = value !== undefined && value !== '';

  const handleSelect = (optValue: string) => {
    onChange?.(optValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}

      <div ref={containerRef} className="relative">
        {/* Кнопка-триггер */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full h-[42px] px-4 bg-white border rounded-xl text-sm text-left',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-all duration-200 flex items-center justify-between gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasValue ? 'text-slate-900' : 'text-slate-400',
            error
              ? 'border-red-500 focus:ring-red-500'
              : isOpen
                ? 'border-indigo-500 ring-2 ring-indigo-500'
                : 'border-slate-200'
          )}
        >
          <span className="truncate">
            {selectedOption?.icon && <span className="mr-1.5">{selectedOption.icon}</span>}
            {displayLabel}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'text-slate-400 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Выпадающий список */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-y-auto max-h-56 p-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2',
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {opt.icon && <span>{opt.icon}</span>}
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-indigo-600 shrink-0" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
