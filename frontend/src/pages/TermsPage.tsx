import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div style={{ padding: '3rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-plum-400)', marginBottom: '2rem' }}>Last updated: October 2026</p>
        <div className="card" style={{ padding: '2rem' }}>
          {[
            { title: 'Acceptance', content: 'By using Taarvya AI, you agree to these terms. If you do not agree, please do not use the service.' },
            { title: 'Service Description', content: 'Taarvya AI provides Vedic astrology chart calculations and interpretations for personal use. Calculations are based on established ephemeris data. Interpretations are traditional and cultural in nature.' },
            { title: 'No Professional Advice', content: 'Astrology interpretations on this platform are for entertainment and personal reflection only. They do not constitute medical, financial, legal, psychological, or any other professional advice.' },
            { title: 'Account Security', content: 'You are responsible for maintaining the security of your account credentials. Do not share your password. Report suspicious activity immediately.' },
            { title: 'Acceptable Use', content: 'You agree not to misuse the platform, attempt unauthorized access, violate applicable laws, or use the service to harm others.' },
            { title: 'Intellectual Property', content: 'Taarvya AI and its original content, features, and functionality are owned by us and are protected by applicable law. Swiss Ephemeris is used under its AGPL v3 license.' },
            { title: 'Changes', content: 'We may update these terms periodically. Continued use after changes constitutes acceptance.' },
          ].map(({ title, content }) => (
            <div key={title} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>{title}</h2>
              <p style={{ margin: 0, color: 'var(--color-plum-600)', lineHeight: 1.7, fontSize: '0.9375rem' }}>{content}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/" style={{ color: 'var(--color-plum-500)', fontSize: '0.875rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
