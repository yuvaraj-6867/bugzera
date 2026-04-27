import { useState, useEffect, memo, type ElementType } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translateText } from '../utils/translateService'

interface AutoTranslateProps {
  children: string
  as?: ElementType
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
  const safeChildren = (children == null || children === 'null') ? '' : children
  const [translated, setTranslated] = useState(safeChildren)

  useEffect(() => {
    if (language === 'en' || !safeChildren || !safeChildren.trim()) {
      setTranslated(safeChildren)
      return
    }

    let cancelled = false

    translateText(safeChildren, 'en', language).then(result => {
      if (!cancelled) {
        setTranslated(result || safeChildren)
      }
    }).catch(() => {
      if (!cancelled) {
        setTranslated(safeChildren)
      }
    })

    return () => { cancelled = true }
  }, [safeChildren, language])

  if (Tag) {
    const Component = Tag as any
    return <Component className={className}>{translated}</Component>
  }

  return <>{translated}</>
})

AutoTranslate.displayName = 'AutoTranslate'

export { AutoTranslate, AutoTranslate as T }
export default AutoTranslate
