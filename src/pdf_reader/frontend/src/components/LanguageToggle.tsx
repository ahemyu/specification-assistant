import React from 'react'
import { useTranslation } from '../core/i18n/LanguageContext'

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useTranslation()
  const toggle = () => setLanguage(language === 'de' ? 'en' : 'de')

  return (
    <button className="lang-toggle" onClick={toggle} aria-label="Toggle language">
      <span className="lang-flag" aria-hidden>
        {language === 'de' ? (
          // German flag (simple SVG)
          <svg width="24" height="24" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="3" height="2" fill="#000"/>
            <rect y="0.66" width="3" height="0.66" fill="#DD0000"/>
            <rect y="1.33" width="3" height="0.67" fill="#FFCE00"/>
          </svg>
        ) : (
          // US flag (simple stylized SVG for English)
          <svg width="24" height="24" viewBox="0 0 19 10" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="19" height="10" fill="#B22234"/>
            <g fill="#fff">
              <rect y="1" width="19" height="1"/>
              <rect y="3" width="19" height="1"/>
              <rect y="5" width="19" height="1"/>
              <rect y="7" width="19" height="1"/>
            </g>
            <rect width="7.6" height="4" fill="#3C3B6E"/>
          </svg>
        )}
      </span>
      <span className="lang-text">{t('toggleButton')}</span>
    </button>
  )
}
