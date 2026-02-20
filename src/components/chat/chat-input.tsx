'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Chat input — auto-growing textarea with send button.
 * - Enter sends the message
 * - Shift+Enter inserts a newline
 * - Auto-resizes up to ~5 lines
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Ask Aura anything…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea as content grows
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    // Cap at ~5 lines (20px line height × 5 + padding)
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
      }
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className={cn(
        'flex items-end gap-2 rounded-xl border bg-aura-surface transition-colors duration-150',
        'border-aura-border focus-within:border-aura-primary/50',
        'px-3 py-2'
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm text-aura-text placeholder:text-aura-text-dim',
          'focus:outline-none leading-relaxed py-1',
          'disabled:opacity-60',
          'max-h-[140px] overflow-y-auto'
        )}
        aria-label="Message Aura"
      />

      {/* Send button */}
      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canSend}
        size="icon"
        className={cn(
          'shrink-0 w-8 h-8 rounded-lg transition-all duration-150',
          canSend
            ? 'bg-aura-primary hover:bg-aura-primary-light'
            : 'bg-aura-border cursor-not-allowed'
        )}
        aria-label="Send message"
      >
        <ArrowUp size={14} strokeWidth={2.5} />
      </Button>
    </div>
  )
}
