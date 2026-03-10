'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function AppearanceSection() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <section className="surface p-6 rounded-xl mb-6">
      <h2 className="text-lg font-medium text-aura-text mb-4">Appearance</h2>

      <div className="flex gap-3">
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors',
            resolvedTheme === 'light'
              ? 'border-aura-primary bg-aura-primary/10 text-aura-text'
              : 'border-aura-border text-aura-text-secondary hover:text-aura-text hover:border-aura-text-secondary'
          )}
        >
          <Sun size={16} />
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors',
            resolvedTheme === 'dark'
              ? 'border-aura-primary bg-aura-primary/10 text-aura-text'
              : 'border-aura-border text-aura-text-secondary hover:text-aura-text hover:border-aura-text-secondary'
          )}
        >
          <Moon size={16} />
          Dark
        </button>
      </div>
    </section>
  )
}
