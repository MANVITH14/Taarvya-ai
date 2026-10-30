import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export function Footer() {
  const { t } = useLang()
  return (
    <footer style={{
      background: 'var(--color-ivory-dark)',
      borderTop: '1px solid rgba(155,142,196,0.15)',
      padding: '2.5rem 0 1.5rem',
    }}>
      <div className="container-app">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-plum-600), var(--color-lavender-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star size={14} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-plum-900)' }}>
                {t.brand}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-plum-400)', lineHeight: 1.6 }}>
              {t.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform</div>
            {[
              { to: '/dashboard', label: t.nav_dashboard },
              { to: '/compatibility', label: t.nav_compatibility },
              { to: '/saved-reports', label: t.nav_reports },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-plum-500)', textDecoration: 'none', marginBottom: '0.375rem' }}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-plum-700)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</div>
            {[
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms of Service' },
              { to: '/disclaimer', label: 'Astrology Disclaimer' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-plum-500)', textDecoration: 'none', marginBottom: '0.375rem' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(155,142,196,0.15)',
          paddingTop: '1.25rem',
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>
            © {new Date().getFullYear()} Taarvya AI. Made with ✨ for India.
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-plum-300)', maxWidth: 400, textAlign: 'right' }}>
            {t.disclaimer_text}
          </p>
        </div>
      </div>
    </footer>
  )
}
