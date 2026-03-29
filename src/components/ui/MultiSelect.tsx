import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MultiSelectProps {
  options: { value: string; label: string; group?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Выберите...',
  searchable = true,
  className,
}: MultiSelectProps) {
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
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredOptions.reduce<Record<string, typeof options>>((acc, opt) => {
    const key = opt.group || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {});

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selected.map((v) => options.find((o) => o.value === v)?.label || v);

  return (
    <div ref={containerRef} className={cn('app-multiselect relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'app-multiselect-trigger',
          'w-full min-h-[42px] px-3 py-2 bg-white border rounded-xl text-left',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'transition-all duration-200 flex items-center gap-2 flex-wrap',
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200'
        )}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        ) : (
          <>
            {selectedLabels.slice(0, 3).map((label, i) => (
              <span
                key={selected[i]}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
              >
                {label}
                <button
                  onClick={(e) => removeTag(selected[i], e)}
                  className="hover:text-indigo-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {selected.length > 3 && (
              <span className="text-xs text-slate-500">+{selected.length - 3}</span>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <button onClick={clearAll} className="p-0.5 hover:bg-slate-100 rounded">
              <X size={14} className="text-slate-400" />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {isOpen && (
        <div className="app-multiselect-dropdown absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск темы..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-56 p-1">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Ничего не найдено</p>
            ) : (
              Object.entries(grouped).map(([group, opts]) => (
                <div key={group}>
                  {group && (
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Задание {group}
                    </p>
                  )}
                  {opts.map((opt) => {
                    const isSelected = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggle(opt.value)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2',
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          )}
                        >
                          {isSelected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">Выбрано: {selected.length}</span>
              <button
                onClick={clearAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Сбросить все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
