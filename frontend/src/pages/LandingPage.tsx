import { Link } from 'react-router-dom'
import { Star, Calculator, BookOpen, Users, Download, ChevronRight, ArrowRight, Sparkles, Moon, Sun, Zap } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { useAuth } from '@/contexts/AuthContext'

const PLANETS = ['☀', '☾', '♂', '♀', '☿', '♃', '♄', '☊', '☋']

function FloatingPlanet({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute',
      fontSize: '1.5rem',
      opacity: 0.15,
      animation: 'float 6s ease-in-out infinite',
      ...style,
    }}>
      {emoji}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <div className="card animate-slide-up" style={{
      padding: '1.5rem',
      animationDelay: `${delay}ms`,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--color-plum-100), var(--color-lavender-100))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color: 'var(--color-plum-600)' }} />
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 0.375rem', color: 'var(--color-plum-900)' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-plum-500)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{
      padding: '1.25rem',
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(155,142,196,0.15)',
    }}>
      <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-plum-800)', fontSize: '0.9375rem', fontFamily: 'var(--font-display)' }}>{q}</h4>
      <p style={{ margin: 0, color: 'var(--color-plum-500)', fontSize: '0.875rem', lineHeight: 1.65 }}>{a}</p>
    </div>
  )
}

export default function LandingPage() {
  const { t } = useLang()
  const { isAuthenticated } = useAuth()

  const features = [
    { icon: Calculator, title: t.feature_1_title, desc: t.feature_1_desc },
    { icon: Moon, title: t.feature_2_title, desc: t.feature_2_desc },
    { icon: Zap, title: t.feature_3_title, desc: t.feature_3_desc },
    { icon: Sparkles, title: t.feature_4_title, desc: t.feature_4_desc },
    { icon: Users, title: t.feature_5_title, desc: t.feature_5_desc },
    { icon: Download, title: t.feature_6_title, desc: t.feature_6_desc },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5rem 0 4rem',
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(155,142,196,0.12), transparent),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(212,160,23,0.06), transparent),
          var(--color-ivory)
        `,
      }}>
        {/* Decorative floating planets */}
        {PLANETS.map((p, i) => (
          <FloatingPlanet key={i} emoji={p} style={{
            top: `${10 + (i * 11)}%`,
            left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
            right: i % 2 !== 0 ? `${5 + i * 2}%` : undefined,
            animationDelay: `${i * 0.7}s`,
            fontSize: `${0.9 + (i % 3) * 0.4}rem`,
          }} />
        ))}

        <div className="container-app" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Celestial badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 1rem',
            background: 'rgba(155,142,196,0.12)',
            border: '1px solid rgba(155,142,196,0.25)',
            borderRadius: '100px',
            fontSize: '0.8125rem',
            color: 'var(--color-plum-600)',
            fontWeight: 500,
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
          }}>
            <Star size={13} fill="currentColor" />
            Authentic Vedic Astrology Platform for India
            <Star size={13} fill="currentColor" />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            color: 'var(--color-plum-900)',
            lineHeight: 1.1,
            margin: '0 0 1.25rem',
            letterSpacing: '-0.02em',
          }}>
            {t.tagline.split('.').map((part, i) => (
              <span key={i}>
                {part.trim()}
                {i === 0 && <>.{' '}</>}
                {i === 1 && <br />}
              </span>
            ))}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1875rem)',
            color: 'var(--color-plum-500)',
            maxWidth: 560,
            margin: '0 auto 2.5rem',
            lineHeight: 1.65,
          }}>
            {t.tagline_sub}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.5rem' }}
            >
              {t.hero_cta_primary}
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              {t.hero_cta_secondary}
            </a>
          </div>

          {/* Sample chart preview */}
          <div style={{
            marginTop: '3.5rem',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: '0 8px 40px rgba(45,27,53,0.1)',
              border: '1px solid rgba(155,142,196,0.2)',
              padding: '1.5rem',
              maxWidth: 340,
              width: '100%',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sample Kundli</span>
                <span className="badge badge-lavender">Lahiri Ayanamsha</span>
              </div>
              {/* Mini North Indian chart */}
              <NorthIndianMiniChart />
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Lagna', value: 'Mesha (Aries)' },
                  { label: 'Moon', value: 'Karka (Cancer)' },
                  { label: 'Nakshatra', value: 'Pushya Pada 2' },
                  { label: 'Sun', value: 'Simha (Leo)' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--color-ivory)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-plum-400)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-plum-800)', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-plum-700), var(--color-plum-600))',
        padding: '2rem 0',
      }}>
        <div className="container-app">
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
            {[
              { num: '9', label: 'Planets Calculated' },
              { num: '27', label: 'Nakshatras' },
              { num: '120', label: 'Dasha Years' },
              { num: 'Lahiri', label: 'Ayanamsha Standard' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>{num}</div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '5rem 0' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.75rem' }}>
              {t.features_title}
            </h2>
            <p style={{ color: 'var(--color-plum-500)', fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto' }}>
              {t.features_sub}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 0', background: 'var(--color-ivory-dark)' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.75rem' }}>
              How It Works
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600, margin: '0 auto' }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Register with your email and set your language preference.' },
              { step: '02', title: 'Enter Birth Details', desc: 'Provide your birth date, time, and place. We resolve coordinates and timezone automatically.' },
              { step: '03', title: 'View Your Kundli', desc: 'Get your North Indian birth chart with precise planetary positions, Nakshatra, and Dasha timeline.' },
              { step: '04', title: 'Read Your Reports', desc: 'Receive AI-powered interpretations in English or Kannada, clearly labeled as traditional perspectives.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-plum-100), var(--color-lavender-100))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--color-plum-600)',
                }}>
                  {step}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--color-plum-900)' }}>{title}</h3>
                  <p style={{ margin: 0, color: 'var(--color-plum-500)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.75rem' }}>
              {t.faq_title}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 680, margin: '0 auto' }}>
            <FAQItem q={t.faq_1_q} a={t.faq_1_a} />
            <FAQItem q={t.faq_2_q} a={t.faq_2_a} />
            <FAQItem q={t.faq_3_q} a={t.faq_3_a} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '5rem 0',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 50%, rgba(155,142,196,0.1), transparent),
          var(--color-ivory-dark)
        `,
      }}>
        <div className="container-app" style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-plum-600), var(--color-lavender-500))',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 20px rgba(78,46,94,0.3)',
          }}>
            <Star size={28} color="#fff" fill="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', margin: '0 0 1rem', color: 'var(--color-plum-900)' }}>
            Discover your cosmic story
          </h2>
          <p style={{ color: 'var(--color-plum-500)', fontSize: '1.0625rem', margin: '0 0 2rem', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
            Get your authentic Vedic birth chart in minutes. Free to start.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
            {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
            <ArrowRight size={18} />
          </Link>
          <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-plum-400)' }}>
            {t.disclaimer_text}
          </p>
        </div>
      </section>
    </div>
  )
}

function NorthIndianMiniChart() {
  // Simplified North Indian chart layout
  const cells = [
    { pos: 'top-left', house: 12 },
    { pos: 'top-mid-left', house: 1, lagna: true },
    { pos: 'top-mid-right', house: 2 },
    { pos: 'top-right', house: 3 },
    { pos: 'mid-left-top', house: 11 },
    { pos: 'center', house: 0 },
    { pos: 'mid-right-top', house: 4 },
    { pos: 'mid-left-bot', house: 10 },
    { pos: 'mid-right-bot', house: 5 },
    { pos: 'bot-left', house: 9 },
    { pos: 'bot-mid-left', house: 8 },
    { pos: 'bot-mid-right', house: 7 },
    { pos: 'bot-right', house: 6 },
  ]

  const samplePlanets: Record<number, string[]> = {
    1: ['As', '☀'],
    4: ['☾', '♃'],
    7: ['♀'],
    10: ['♂', '♄'],
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(4, 1fr)',
      width: '100%',
      aspectRatio: '1',
      border: '2px solid var(--color-plum-200)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--color-ivory)',
    }}>
      {/* North Indian Kundli layout — 12 outer cells + 2 center triangles */}
      {Array.from({ length: 16 }, (_, i) => {
        const row = Math.floor(i / 4)
        const col = i % 4
        const isCenter = (row === 1 && col === 1) || (row === 1 && col === 2) || (row === 2 && col === 1) || (row === 2 && col === 2)
        
        if (isCenter) {
          return (
            <div key={i} style={{
              background: 'var(--color-cream)',
              borderRight: col === 1 ? '1px solid var(--color-plum-200)' : undefined,
              borderBottom: row === 1 ? '1px solid var(--color-plum-200)' : undefined,
            }} />
          )
        }

        const houseMap: Record<string, number> = {
          '0,0': 12, '0,1': 1, '0,2': 2, '0,3': 3,
          '1,0': 11, '1,3': 4,
          '2,0': 10, '2,3': 5,
          '3,0': 9, '3,1': 8, '3,2': 7, '3,3': 6,
        }
        const house = houseMap[`${row},${col}`] || 0
        const planets = samplePlanets[house] || []

        return (
          <div key={i} style={{
            border: '1px solid var(--color-plum-200)',
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            background: house === 1 ? 'rgba(155,142,196,0.08)' : undefined,
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--color-plum-300)' }}>{house}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-plum-700)' }}>{planets.join(' ')}</div>
          </div>
        )
      })}
    </div>
  )
}
