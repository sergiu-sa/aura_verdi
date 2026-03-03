export default function ChatLoading() {
  return (
    <div className="h-[calc(100dvh-56px-68px)] md:h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2C2C3A] border-t-[#0D7377] rounded-full animate-spin" />
          <p className="text-sm text-[#8888A0]">Loading chat...</p>
        </div>
      </div>
    </div>
  )
}
