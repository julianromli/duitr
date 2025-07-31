import React from 'react'
import { useTranslation } from 'react-i18next'
import { Toggle } from './toggle'
import { setAppLanguage } from '@/i18n'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language
  const isEnglish = currentLanguage === 'en'

  const handleToggle = () => {
    const newLanguage = isEnglish ? 'id' : 'en'
    setAppLanguage(newLanguage)
  }

  return (
    <Toggle
      pressed={isEnglish}
      onPressedChange={handleToggle}
      aria-label={`Switch to ${isEnglish ? 'Indonesian' : 'English'}`}
      className={`
        h-9 px-3 text-xs font-medium border border-gray-200 
        hover:bg-gray-50 transition-colors
        data-[state=on]:bg-lime-400 data-[state=on]:text-black
        data-[state=off]:bg-transparent data-[state=off]:text-gray-700
        ${className}
      `}
    >
      {isEnglish ? 'EN' : 'ID'}
    </Toggle>
  )
}