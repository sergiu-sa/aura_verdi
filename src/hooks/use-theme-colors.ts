'use client'

import { useTheme } from 'next-themes'

/**
 * Returns raw hex color values for the current theme.
 * Used by Recharts and other SVG-based components that need
 * string color values instead of CSS classes.
 */
export function useThemeColors() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    background: isDark ? '#121218' : '#F7F7FA',
    surface: isDark ? '#1C1C28' : '#FFFFFF',
    surfaceHigh: isDark ? '#24243A' : '#FFFFFF',
    text: isDark ? '#E8E8EC' : '#18182B',
    textSecondary: isDark ? '#8888A0' : '#6B6B80',
    textDim: isDark ? '#55556A' : '#9999AD',
    border: isDark ? '#2C2C3A' : '#E2E2EC',
    primary: '#0D7377',
    primaryLight: '#11999E',
    safe: isDark ? '#2D8B6F' : '#1A7A50',
    safeMuted: isDark ? '#1E5C49' : '#E6F5ED',
    warning: isDark ? '#D4A039' : '#A67A10',
    warningMuted: isDark ? '#5C3D0A' : '#FEF5E0',
    danger: isDark ? '#C75050' : '#B83E3E',
    dangerMuted: isDark ? '#4A1414' : '#FDE8E8',
    positive: isDark ? '#4DD9A0' : '#0D8050',
    input: isDark ? '#1A1A26' : '#F0F0F5',
    // Chart-specific — grid lines, axes
    chartGrid: isDark ? '#2C2C3A' : '#E2E2EC',
    chartAxis: isDark ? '#8888A0' : '#6B6B80',
    // Overlay tint for hover states
    hoverOverlay: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  }
}
