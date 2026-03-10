export default function ChatLoading() {
  return (
    <div className="h-[calc(100dvh-56px-68px)] md:h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-aura-border border-t-aura-primary rounded-full animate-spin" />
          <p className="text-sm text-aura-text-secondary">Loading chat...</p>
        </div>
      </div>
    </div>
  )
}
