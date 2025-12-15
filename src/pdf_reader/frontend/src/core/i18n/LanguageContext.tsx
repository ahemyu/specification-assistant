import React, { createContext, useContext, useState } from 'react'
import { de } from './translations/de'
import { en } from './translations/en'

type Language = 'de' | 'en'
type Translations = typeof de

interface LanguageContextProps {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof Translations) => string
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')
  const translations = language === 'de' ? de : en
  const t = (key: keyof Translations) => translations[key] || (key as string)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider')
  return context
}
