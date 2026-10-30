import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function DisclaimerPage() {
  return (
    <div style={{ padding: '3rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
          <AlertTriangle size={28} style={{ color: 'var(--color-gold-500)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: 0, color: 'var(--color-plum-900)' }}>Astrology Disclaimer</h1>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--color-plum-700)', lineHeight: 1.75, fontSize: '1rem', margin: '0 0 1.25rem' }}>
            Vedic astrology interpretations provided by Taarvya AI are based on traditional cultural and symbolic systems developed over thousands of years. They are offered for <strong>entertainment and personal reflection only</strong>.
          </p>
          {[
            'Astrology interpretations are NOT medical advice and should never replace consultation with qualified healthcare professionals.',
            'Astrology interpretations are NOT financial advice and should never be used for investment, business, or financial decisions.',
            'Astrology interpretations are NOT legal advice and should not influence legal decisions.',
            'Astrology interpretations CANNOT guarantee specific outcomes, events, marriage timing, career results, or life events.',
            'Planetary calculations are astronomical in nature; the meaning assigned to placements is traditional and symbolic.',
            'Individuals of the same birth chart may have very different life experiences due to countless environmental, social, and personal factors.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: 'var(--color-gold-400)', marginTop: '0.5rem' }} />
              <p style={{ margin: 0, color: 'var(--color-plum-600)', lineHeight: 1.65, fontSize: '0.9375rem' }}>{item}</p>
            </div>
          ))}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-gold-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gold-200)' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-plum-700)', lineHeight: 1.6 }}>
              <strong>Swiss Ephemeris Licensing:</strong> This platform uses the Swiss Ephemeris library for astronomical calculations. Swiss Ephemeris is dual-licensed under AGPL v3 (open source) and a commercial license. See <a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-plum-600)' }}>astro.com/swisseph</a> for licensing details.
            </p>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/" style={{ color: 'var(--color-plum-500)', fontSize: '0.875rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
