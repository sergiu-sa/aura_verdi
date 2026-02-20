interface QuickActionsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  { label: 'How am I doing?', prompt: 'Give me a quick summary of my financial situation right now.' },
  { label: 'Upcoming bills?', prompt: 'What bills do I have coming up, and do I have enough to cover them?' },
  { label: 'Help with a letter', prompt: 'I received a financial or legal letter and need help understanding it.' },
  { label: 'What is BSU?', prompt: 'Can you explain what BSU is and whether I should be using it?' },
]

/**
 * Quick-action chips shown below the chat input.
 * Tapping one sends a pre-written prompt immediately.
 * Hidden once the conversation has started (handled by parent).
 */
export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.prompt)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-aura-border text-aura-text-secondary hover:text-aura-text hover:border-aura-primary/40 hover:bg-aura-primary/5 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
