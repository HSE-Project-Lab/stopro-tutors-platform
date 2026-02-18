// src/components/ui/LaTeX.tsx

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXProps {
  children: string;
  block?: boolean;
  className?: string;
}

/**
 * Рендерит текст с inline LaTeX ($...$) и block LaTeX ($$...$$)
 * Обычный текст остаётся как есть
 */
export function LaTeX({ children, className = '' }: LaTeXProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Разбиваем текст на части: обычный текст и LaTeX-формулы
    const html = renderMixedContent(children);
    containerRef.current.innerHTML = html;
  }, [children]);

  return <div ref={containerRef} className={className} />;
}

function renderMixedContent(text: string): string {
  // Сначала обрабатываем блочные формулы $$...$$
  // Затем инлайновые $...$
  let result = text;

  // Блочные формулы: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="text-red-500">[Ошибка LaTeX: ${formula}]</span>`;
    }
  });

  // Инлайновые формулы: $...$
  result = result.replace(/\$([^$]+?)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="text-red-500">[Ошибка LaTeX: ${formula}]</span>`;
    }
  });

  // Переносы строк → <br>
  result = result.replace(/\n/g, '<br/>');

  return result;
}

/**
 * Компонент для предпросмотра LaTeX в реальном времени
 */
interface LaTeXPreviewProps {
  content: string;
  label?: string;
  className?: string;
}

export function LaTeXPreview({ content, label, className = '' }: LaTeXPreviewProps) {
  if (!content.trim()) {
    return (
      <div
        className={`border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 ${className}`}
      >
        {label || 'Предпросмотр появится здесь...'}
      </div>
    );
  }

  return (
    <div className={`border border-slate-200 rounded-xl p-4 bg-slate-50 ${className}`}>
      {label && (
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      )}
      <LaTeX className="text-slate-900 leading-relaxed">{content}</LaTeX>
    </div>
  );
}
