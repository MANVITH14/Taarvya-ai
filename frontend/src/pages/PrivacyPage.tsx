import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div style={{ padding: '3rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-plum-400)', marginBottom: '2rem' }}>Last updated: October 2026</p>
        
        <div className="card" style={{ padding: '2rem' }}>
          {[
            {
              title: 'Data We Collect',
              content: 'We collect your email address, name, and birth details (date, time, place) that you voluntarily provide. We also collect usage data such as page views and feature usage to improve the service.'
            },
            {
              title: 'How We Use Your Data',
              content: 'Your birth details are used exclusively to calculate astrological charts and generate reports. We do not sell your personal data to third parties. Birth details may be sent to the OpenAI API (if you use AI reports) for the sole purpose of generating your interpretation — no personally identifying information is included in AI prompts.'
            },
            {
              title: 'Data Security',
              content: 'Passwords are hashed using Argon2id. Authentication tokens are short-lived JWT tokens. Data is transmitted over HTTPS. We follow industry best practices for data security.'
            },
            {
              title: 'Your Rights',
              content: 'You have the right to access, correct, export, or delete your data at any time through your Account Settings page. Account deletion removes all your personal data and birth profiles from our systems within 30 days.'
            },
            {
              title: 'Cookies',
              content: 'We use an HTTP-only cookie for secure session management (refresh tokens). We do not use tracking or advertising cookies.'
            },
            {
              title: 'Contact',
              content: 'For privacy inquiries, contact: privacy@taarvya.ai'
            },
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
