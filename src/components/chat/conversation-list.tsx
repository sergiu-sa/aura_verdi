'use client'

/**
 * ConversationList — shows past chat conversations.
 * Collapsible panel: toggle button in chat header area.
 */

import { Plus, X } from 'lucide-react'
import type { ConversationSummary } from '@/app/(app)/chat/page'

interface Props {
  conversations: ConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewConversation: () => void
  onClose: () => void
}

function relativeDate(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' })
}

export function ConversationList({ conversations, activeId, onSelect, onNewConversation, onClose }: Props) {
  return (
    <div className="flex flex-col h-full bg-[#121218] border-r border-[#2C2C3A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C3A]">
        <h3 className="text-sm font-medium text-[#E8E8EC]">Conversations</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewConversation}
            className="p-1.5 text-[#8888A0] hover:text-[#0D7377] transition-colors"
            title="New conversation"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8888A0] hover:text-[#E8E8EC] transition-colors md:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-4 py-6 text-xs text-[#55556A] text-center">
            No conversations yet. Start chatting with Aura!
          </p>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left px-4 py-3 transition-colors relative ${
                    isActive
                      ? 'bg-[#0D7377]/10 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[#0D7377] before:rounded-r'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <p className={`text-sm truncate ${isActive ? 'text-[#E8E8EC]' : 'text-[#C0C0D0]'}`}>
                    {conv.preview}
                  </p>
                  <p className="text-[10px] text-[#55556A] mt-0.5">
                    {relativeDate(conv.lastMessageAt)}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
