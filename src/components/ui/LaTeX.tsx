import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXProps {
  children: string;
  block?: boolean;
  className?: string;
}

export function LaTeX({ children, className = '' }: LaTeXProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const html = renderMixedContent(children);
    containerRef.current.innerHTML = html;
  }, [children]);

  return <div ref={containerRef} className={className} />;
}

function renderMixedContent(text: string): string {
  let result = text;

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

  result = result.replace(/\n/g, '<br/>');

  return result;
}

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
