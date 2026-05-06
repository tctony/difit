import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';

interface FinishReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (summary: string) => void;
  hasComments: boolean;
}

export function FinishReviewModal({
  isOpen,
  onClose,
  onConfirm,
  hasComments,
}: FinishReviewModalProps) {
  const { enableScope, disableScope } = useHotkeysContext();

  useHotkeys('escape', () => onClose(), { enabled: isOpen, enableOnFormTags: true }, [
    onClose,
    isOpen,
  ]);

  useEffect(() => {
    if (isOpen) {
      disableScope('navigation');
    } else {
      enableScope('navigation');
    }

    return () => {
      enableScope('navigation');
    };
  }, [isOpen, enableScope, disableScope]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <FinishReviewForm hasComments={hasComments} onClose={onClose} onConfirm={onConfirm} />
    </div>
  );
}

interface FinishReviewFormProps {
  hasComments: boolean;
  onClose: () => void;
  onConfirm: (summary: string) => void;
}

function FinishReviewForm({ hasComments, onClose, onConfirm }: FinishReviewFormProps) {
  const defaultSummary = hasComments ? '根据以下评论意见进行修改' : 'ok';
  const [summary, setSummary] = useState(defaultSummary);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(summary.trim() || defaultSummary);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onConfirm(summary.trim() || defaultSummary);
    }
  };

  return (
    <div className="relative bg-github-bg-primary border border-github-border rounded-lg shadow-lg w-full max-w-md mx-4">
      <div className="border-b border-github-border px-5 py-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-github-text-primary">Finish Review</h2>
        <button
          onClick={onClose}
          className="text-github-text-secondary hover:text-github-text-primary transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
        <label className="block text-sm text-github-text-secondary mb-2">Overall comment</label>
        <textarea
          ref={textareaRef}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md border border-github-border bg-github-bg-primary text-github-text-primary placeholder-github-text-muted focus:outline-none focus:ring-2 focus:ring-github-accent focus:border-transparent resize-vertical"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-github-text-muted">
            {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to submit
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border border-github-border text-github-text-secondary hover:text-github-text-primary hover:bg-github-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: 'var(--color-yellow-btn-bg)',
                color: 'var(--color-yellow-btn-text)',
                border: '1px solid var(--color-yellow-btn-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-yellow-btn-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--color-yellow-btn-hover-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-yellow-btn-bg)';
                e.currentTarget.style.borderColor = 'var(--color-yellow-btn-border)';
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
