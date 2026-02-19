import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { translations, languageNames } from '../i18n/translations'

export type Language = 'en' | 'ta' | 'hi' | 'es' | 'fr' | 'ja'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  languageNames: Record<string, string>
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  languageNames,
})

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  )
}
