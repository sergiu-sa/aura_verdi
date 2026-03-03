'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  displayName: string
  email: string
}

export function ProfileSection({ displayName, email }: Props) {
  const router = useRouter()

  // ── Display name state ──────────────────────────────────────────────
  const [name, setName] = useState(displayName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Password state ──────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === displayName) return
    setNameSaving(true)
    setNameMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setNameMessage({ type: 'error', text: data.error || 'Failed to save.' })
        return
      }

      setNameMessage({ type: 'success', text: 'Name updated.' })
      router.refresh()
    } catch {
      setNameMessage({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setNameSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwMessage(null)

    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setPwSaving(true)

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        setPwMessage({ type: 'error', text: data.error || 'Failed to change password.' })
        return
      }

      setPwMessage({ type: 'success', text: 'Password changed.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPwMessage({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">Account</p>
      <h2 className="font-display text-2xl text-[#E8E8EC] mb-4">Profile</h2>

      <div className="rounded-xl bg-[#1C1C28] border border-[#2C2C3A] p-5 space-y-5">
        {/* Email (read-only) */}
        <div>
          <label className="block text-xs text-[#8888A0] mb-1">Email</label>
          <p className="text-sm text-[#E8E8EC]">{email}</p>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs text-[#8888A0] mb-1">Display name</label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1A1A26] border-[#2C2C3A] text-[#E8E8EC] flex-1"
              maxLength={100}
            />
            <Button
              onClick={handleSaveName}
              disabled={nameSaving || !name.trim() || name.trim() === displayName}
              className="bg-[#0D7377] hover:bg-[#11999E] text-white"
            >
              {nameSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {nameMessage && (
            <p className={`text-xs mt-1.5 ${nameMessage.type === 'success' ? 'text-[#4DD9A0]' : 'text-[#F08080]'}`}>
              {nameMessage.text}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2C2C3A]" />

        {/* Change password */}
        <div>
          <p className="text-xs text-[#8888A0] mb-3">Change password</p>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#1A1A26] border-[#2C2C3A] text-[#E8E8EC]"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#1A1A26] border-[#2C2C3A] text-[#E8E8EC]"
            />
            <Button
              onClick={handleChangePassword}
              disabled={pwSaving || !newPassword || !confirmPassword}
              className="bg-[#0D7377] hover:bg-[#11999E] text-white"
            >
              {pwSaving ? 'Changing...' : 'Change password'}
            </Button>
          </div>
          {pwMessage && (
            <p className={`text-xs mt-1.5 ${pwMessage.type === 'success' ? 'text-[#4DD9A0]' : 'text-[#F08080]'}`}>
              {pwMessage.text}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
