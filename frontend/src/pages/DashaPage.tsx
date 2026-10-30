import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { chartApi, profileApi, type DashaPeriod } from '@/lib/api'
import { useLang } from '@/contexts/LangContext'
import { ChevronLeft, Calendar } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

const DASHA_COLORS: Record<string, string> = {
  Sun: '#B8860B', Moon: '#5B8C8C', Mercury: '#4E7D4E',
  Venus: '#C47A7A', Mars: '#B5451B', Jupiter: '#7B4C8E',
  Saturn: '#555', Rahu: '#1B4E7B', Ketu: '#7B1B1B',
}

function DashaBar({ dasha }: { dasha: DashaPeriod }) {
  const today = new Date()
  const start = parseISO(dasha.start)
  const end = parseISO(dasha.end)
  const totalDays = differenceInDays(end, start)
  const elapsed = Math.max(0, Math.min(differenceInDays(today, start), totalDays))
  const pct = totalDays > 0 ? (elapsed / totalDays) * 100 : 0
  const color = DASHA_COLORS[dasha.planet] || 'var(--color-plum-400)'

  return (
    <div className={`dasha-item ${dasha.is_current ? 'dasha-item-current' : ''}`}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: `${color}18`,
        border: `2px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color }}>
          {dasha.planet.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-plum-900)' }}>
              {dasha.planet} Mahadasha
            </span>
            {dasha.is_current && <span className="badge badge-plum">Current</span>}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-plum-400)' }}>
            {dasha.years.toFixed(1)} yrs
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <Calendar size={11} style={{ color: 'var(--color-plum-400)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-plum-500)' }}>
            {dasha.start} → {dasha.end}
          </span>
        </div>

        {dasha.is_current && (
          <div style={{ background: 'var(--color-plum-100)', borderRadius: '100px', height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}99)`,
              borderRadius: '100px',
              transition: 'width 1s ease',
            }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashaPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLang()

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.get(id!),
  })

  const { data: chart, isLoading } = useQuery({
    queryKey: ['chart', id],
    queryFn: () => chartApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" style={{ width: 36, height: 36, border: '3px solid var(--color-plum-200)', borderTopColor: 'var(--color-plum-600)', borderRadius: '50%' }} />
    </div>
  )

  const currentDasha = chart?.vimshottari_dasha.find((d) => d.is_current)

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link to={`/profile/${id}/kundli`} className="btn btn-ghost btn-sm">
            <ChevronLeft size={16} /> Back to Kundli
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.125rem', color: 'var(--color-plum-900)' }}>
              {t.dasha}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-plum-500)', fontSize: '0.875rem' }}>{profile?.name}</p>
          </div>
        </div>

        {currentDasha && (
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, var(--color-plum-50), var(--color-lavender-50))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-plum-200)',
            marginBottom: '1.5rem',
          }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8125rem', color: 'var(--color-plum-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.current_dasha}
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: '0 0 0.375rem', color: 'var(--color-plum-900)' }}>
              {currentDasha.planet} Mahadasha
            </h2>
            <p style={{ margin: 0, color: 'var(--color-plum-600)', fontSize: '0.875rem' }}>
              {currentDasha.start} → {currentDasha.end} ({currentDasha.years.toFixed(1)} years)
            </p>
          </div>
        )}

        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 1rem', color: 'var(--color-plum-900)' }}>
            Mahadasha Timeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {chart?.vimshottari_dasha.map((dasha, i) => (
              <DashaBar key={i} dasha={dasha} />
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-plum-400)', lineHeight: 1.6 }}>
            Vimshottari Dasha system — 120 year cycle based on Moon's Nakshatra at birth.
            Periods are calculated from the Moon's position in {chart?.moon_nakshatra} Nakshatra.
          </p>
        </div>
      </div>
    </div>
  )
}
