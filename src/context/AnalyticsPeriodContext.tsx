import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  computeAnalyticsBounds,
  type AnalyticsDatePreset,
} from '@/context/analyticsPeriodUtils'

export type { AnalyticsDatePreset }

interface AnalyticsPeriodContextValue {
  preset: AnalyticsDatePreset
  setPreset: (p: AnalyticsDatePreset) => void
  customStartDate: Date | undefined
  customEndDate: Date | undefined
  setCustomRange: (from: Date | undefined, to: Date | undefined) => void
  periodStart: Date
  periodEnd: Date
  setPeriodFromAnalysis: (start: Date, end: Date) => void
}

const AnalyticsPeriodContext = createContext<AnalyticsPeriodContextValue | undefined>(
  undefined,
)

export function AnalyticsPeriodProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<AnalyticsDatePreset>('month')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)

  const { periodStart, periodEnd } = useMemo(
    () => computeAnalyticsBounds(preset, customStartDate, customEndDate),
    [preset, customStartDate, customEndDate],
  )

  const setPreset = useCallback((p: AnalyticsDatePreset) => {
    setPresetState(p)
  }, [])

  const setCustomRange = useCallback((from: Date | undefined, to: Date | undefined) => {
    setCustomStartDate(from)
    setCustomEndDate(to)
  }, [])

  const setPeriodFromAnalysis = useCallback((start: Date, end: Date) => {
    setPresetState('custom')
    setCustomStartDate(start)
    setCustomEndDate(end)
  }, [])

  const value = useMemo(
    () => ({
      preset,
      setPreset,
      customStartDate,
      customEndDate,
      setCustomRange,
      periodStart,
      periodEnd,
      setPeriodFromAnalysis,
    }),
    [
      preset,
      setPreset,
      customStartDate,
      customEndDate,
      setCustomRange,
      periodStart,
      periodEnd,
      setPeriodFromAnalysis,
    ],
  )

  return (
    <AnalyticsPeriodContext.Provider value={value}>
      {children}
    </AnalyticsPeriodContext.Provider>
  )
}

export function useAnalyticsPeriod() {
  const ctx = useContext(AnalyticsPeriodContext)
  if (!ctx) {
    throw new Error('useAnalyticsPeriod must be used within AnalyticsPeriodProvider')
  }
  return ctx
}

export function useOptionalAnalyticsPeriod() {
  return useContext(AnalyticsPeriodContext)
}
