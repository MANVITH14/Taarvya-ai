import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
      textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✦</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: '0 0 0.75rem', color: 'var(--color-plum-900)' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--color-plum-500)', margin: '0 0 2rem', fontSize: '1rem' }}>
          This page has wandered to another cosmic realm.
        </p>
        <Link to="/" className="btn btn-primary">
          <Star size={16} />
          Return to Home
        </Link>
      </div>
    </div>
  )
}
