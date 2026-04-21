export type AnalyticsDatePreset = '7days' | '30days' | 'month' | 'custom'

export function computeAnalyticsBounds(
  preset: AnalyticsDatePreset,
  customStart: Date | undefined,
  customEnd: Date | undefined,
  referenceNow = new Date(),
): { start: Date; end: Date } {
  const endOfToday = new Date(referenceNow)
  endOfToday.setHours(23, 59, 59, 999)

  if (preset === 'custom' && customStart && customEnd) {
    const start = new Date(customStart)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (preset === '7days') {
    const start = new Date(referenceNow)
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
    return { start, end: endOfToday }
  }

  if (preset === '30days') {
    const start = new Date(referenceNow)
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
    return { start, end: endOfToday }
  }

  const start = new Date(referenceNow.getFullYear(), referenceNow.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  return { start, end: endOfToday }
}
