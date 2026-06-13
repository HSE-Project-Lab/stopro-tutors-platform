import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListMinus } from 'lucide-react';

export interface RichTextEditorHandle {
  focus: () => void;
  clear: () => void;
  getHtml: () => string;
}

interface RichTextEditorProps {
  initialHtml?: string;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  compact?: boolean;
  onChange?: (html: string) => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikeThrough';

const PLAIN_LIST_CLASS = 'cw-list-plain';

function closestUl(): HTMLUListElement | null {
  const selection = window.getSelection();
  let node: Node | null = selection?.anchorNode ?? null;
  while (node) {
    if (node instanceof HTMLUListElement) return node;
    node = node.parentNode;
  }
  return null;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ initialHtml, placeholder, autoFocus, ariaLabel, compact, onChange, onEnter, onEscape }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(!initialHtml);
    const [active, setActive] = useState({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      ul: false,
      ol: false,
    });

    const syncEmpty = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      setIsEmpty((el.textContent ?? '').trim().length === 0 && !el.querySelector('li'));
    }, []);

    const refreshActive = useCallback(() => {
      const el = editorRef.current;
      if (!el || document.activeElement !== el) return;
      try {
        setActive({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          ul: document.queryCommandState('insertUnorderedList'),
          ol: document.queryCommandState('insertOrderedList'),
        });
      } catch {
        /* queryCommandState недоступен — игнорируем */
      }
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      clear: () => {
        if (editorRef.current) editorRef.current.innerHTML = '';
        setIsEmpty(true);
        onChange?.('');
      },
      getHtml: () => editorRef.current?.innerHTML ?? '',
    }));

    useEffect(() => {
      if (editorRef.current && initialHtml) {
        editorRef.current.innerHTML = initialHtml;
        syncEmpty();
      }
      if (autoFocus) editorRef.current?.focus();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      document.addEventListener('selectionchange', refreshActive);
      return () => document.removeEventListener('selectionchange', refreshActive);
    }, [refreshActive]);

    const handleInput = () => {
      syncEmpty();
      onChange?.(editorRef.current?.innerHTML ?? '');
      refreshActive();
    };

    const exec = (command: string) => {
      editorRef.current?.focus();
      document.execCommand(command);
      handleInput();
    };

    const applyInline = (format: InlineFormat) => exec(format);

    const applyOrderedList = () => {
      editorRef.current?.focus();
      document.execCommand('insertOrderedList');
      handleInput();
    };

    const applyUnorderedList = (plain: boolean) => {
      editorRef.current?.focus();
      document.execCommand('insertUnorderedList');
      const ul = closestUl();
      if (ul) {
        if (plain) ul.classList.add(PLAIN_LIST_CLASS);
        else ul.classList.remove(PLAIN_LIST_CLASS);
      }
      handleInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && onEnter) {
        e.preventDefault();
        onEnter();
        return;
      }
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          applyInline('bold');
        } else if (key === 'i') {
          e.preventDefault();
          applyInline('italic');
        } else if (key === 'u') {
          e.preventDefault();
          applyInline('underline');
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      handleInput();
    };

    const btn = (isActive: boolean) =>
      `flex items-center justify-center rounded transition-colors ${compact ? 'w-7 h-7' : 'w-8 h-8'} ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
      }`;
    const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';

    const tool = (
      title: string,
      isActive: boolean,
      onClick: () => void,
      Icon: typeof Bold
    ) => (
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={isActive}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={btn(isActive)}
      >
        <Icon className={iconSize} />
      </button>
    );

    const plainListActive = active.ul && !!closestUl()?.classList.contains(PLAIN_LIST_CLASS);

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-0.5 px-1 py-1 border-b border-gray-200">
          {tool('Жирный (Ctrl+B)', active.bold, () => applyInline('bold'), Bold)}
          {tool('Курсив (Ctrl+I)', active.italic, () => applyInline('italic'), Italic)}
          {tool('Подчёркнутый (Ctrl+U)', active.underline, () => applyInline('underline'), Underline)}
          {tool('Зачёркнутый', active.strikeThrough, () => applyInline('strikeThrough'), Strikethrough)}
          <span className="w-px h-5 bg-gray-200 mx-1" />
          {tool('Маркированный список', active.ul && !plainListActive, () => applyUnorderedList(false), List)}
          {tool('Нумерованный список', active.ol, applyOrderedList, ListOrdered)}
          {tool('Список без маркеров', plainListActive, () => applyUnorderedList(true), ListMinus)}
        </div>
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label={ariaLabel}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={refreshActive}
            className={`rich-content rich-editor w-full px-3 py-2 focus:outline-none overflow-y-auto ${
              compact ? 'text-sm max-h-32' : 'max-h-40'
            }`}
          />
          {isEmpty && placeholder && (
            <span className="pointer-events-none absolute left-3 top-2 text-gray-400 select-none">
              {placeholder}
            </span>
          )}
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
