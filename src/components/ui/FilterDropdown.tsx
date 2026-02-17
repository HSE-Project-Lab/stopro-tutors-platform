import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  group?: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
}

export function FilterDropdown({
  options,
  selected,
  onChange,
  placeholder,
  multiple = false,
  searchable = false,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredOptions.reduce<Record<string, FilterOption[]>>((acc, opt) => {
    const key = opt.group || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {});

  const handleSelect = (value: string) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      if (selected.includes(value)) {
        onChange([]);
      } else {
        onChange([value]);
      }
      setIsOpen(false);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getButtonLabel = () => {
    if (selected.length === 0) return placeholder;
    if (!multiple) {
      const opt = options.find((o) => o.value === selected[0]);
      return opt ? opt.label : placeholder;
    }
    return `${placeholder} · ${selected.length}`;
  };

  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Кнопка-триггер */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-[42px] px-3 bg-white border rounded-xl text-sm text-left',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'transition-all duration-200 flex items-center gap-2 whitespace-nowrap',
          hasSelection
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
            : 'border-slate-200 text-slate-600',
          isOpen && 'ring-2 ring-indigo-500 border-transparent'
        )}
      >
        <span className="truncate">{getButtonLabel()}</span>

        <div className="flex items-center gap-0.5 ml-auto shrink-0">
          {hasSelection && (
            <button
              onClick={clearAll}
              className="p-0.5 hover:bg-indigo-200/50 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={cn('transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-full max-w-[280px] right-0">
          {/* Поиск */}
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Опции */}
          <div className="overflow-y-auto max-h-64 p-1">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Ничего не найдено</p>
            ) : (
              Object.entries(grouped).map(([group, opts]) => (
                <div key={group || '__ungrouped'}>
                  {group && (
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Задание {group}
                    </p>
                  )}
                  {opts.map((opt) => {
                    const isSelected = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 flex items-center justify-center shrink-0 transition-colors border-2',
                            multiple ? 'rounded' : 'rounded-full',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-slate-300'
                          )}
                        >
                          {isSelected && (
                            <Check size={10} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                        {opt.icon && <span>{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Футер */}
          {multiple && selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Выбрано: {selected.length}</span>
              <button
                onClick={clearAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}