/**
 * Language/localization context.
 * Supports English ('en') and Kannada ('kn').
 */
import React, { createContext, useContext, useState, useCallback } from 'react'
import { en } from '@/i18n/en'
import { kn } from '@/i18n/kn'

export type Language = 'en' | 'kn'
export type Translations = Record<keyof typeof en, string>

interface LangContextValue {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

const TRANSLATIONS: Record<Language, Translations> = { en, kn }

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem('lang') as Language | null
    return stored === 'kn' ? 'kn' : 'en'
  })

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('lang', lang)
    setLangState(lang)
    document.documentElement.lang = lang
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'kn' : 'en')
  }, [language, setLanguage])

  return (
    <LangContext.Provider value={{ language, t: TRANSLATIONS[language], setLanguage, toggleLanguage }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
