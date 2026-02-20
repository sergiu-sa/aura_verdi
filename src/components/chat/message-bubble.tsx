import { cn } from '@/lib/utils/cn'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  /** Show the typing indicator (three animated dots) instead of content */
  isTyping?: boolean
}

/**
 * A single chat message bubble.
 * - User messages: right-aligned, teal background
 * - Aura messages: left-aligned, surface background, with avatar
 */
export function MessageBubble({ role, content, isTyping = false }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Aura avatar — only shown for assistant messages */}
      {!isUser && (
        <div className="shrink-0 mt-1">
          <AuraAvatar />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-aura-primary text-white rounded-tr-sm'
            : 'bg-aura-surface border border-aura-border text-aura-text rounded-tl-sm'
        )}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <MessageContent content={content} isUser={isUser} />
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

/**
 * Renders message content with basic formatting support.
 * Handles bold (**text**), line breaks, and simple lists.
 */
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null

  // Split into paragraphs, then render each line
  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((para, i) => {
        const lines = para.split('\n').filter(Boolean)

        // Detect list paragraph (all lines start with - or *)
        const isList = lines.length > 1 && lines.every((l) => /^[-*•]\s/.test(l))

        if (isList) {
          return (
            <ul key={i} className={cn('flex flex-col gap-1 pl-4 list-none')}>
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span className={cn('mt-1 w-1 h-1 rounded-full shrink-0', isUser ? 'bg-white/60' : 'bg-aura-primary')} />
                  <span>{renderInline(line.replace(/^[-*•]\s/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {renderInline(line)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Renders inline markdown: **bold** and *italic*.
 * Returns an array of React nodes.
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Match **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    } else {
      parts.push(<em key={match.index}>{match[3]}</em>)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length === 1 ? parts[0] : parts
}

/** Three animated dots while Aura is thinking */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1" aria-label="Aura is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-aura-text-dim animate-pulse-gentle"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  )
}

/** Small Aura avatar for assistant messages */
function AuraAvatar() {
  return (
    <div className="relative w-8 h-8 shrink-0">
      <div className="absolute inset-0 rounded-full border border-aura-primary/50 bg-aura-surface" />
      <div className="absolute inset-[3px] rounded-full border border-aura-primary/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-aura-primary text-xs leading-none">A</span>
      </div>
    </div>
  )
}
