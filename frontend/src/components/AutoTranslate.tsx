import { useState, useEffect, memo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translateText } from '../utils/translateService'

interface AutoTranslateProps {
  children: string
  as?: keyof JSX.IntrinsicElements
  className?: string
}

/**
 * Auto-translate component. Wraps any text and translates it
 * based on the current language setting.
 *
 * Usage: <T>Some English text</T>
 * Or: <T as="p" className="text-gray-600">Description here</T>
 */
const AutoTranslate = memo(({ children, as: Tag, className }: AutoTranslateProps) => {
  const { language } = useLanguage()
  const [translated, setTranslated] = useState(children)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (language === 'en' || !children || !children.trim()) {
      setTranslated(children)
      return
    }

    let cancelled = false
    setLoading(true)

    translateText(children, 'en', language).then(result => {
      if (!cancelled) {
        setTranslated(result)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setTranslated(children)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [children, language])

  if (Tag) {
    return <Tag className={className}>{translated}</Tag>
  }

  return <>{translated}</>
})

AutoTranslate.displayName = 'AutoTranslate'

export { AutoTranslate, AutoTranslate as T }
export default AutoTranslate
