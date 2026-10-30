import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { chartApi, profileApi, type ChartData, type PlanetPosition } from '@/lib/api'
import { useLang } from '@/contexts/LangContext'
import { Loader, AlertTriangle, Info, ChevronRight, Download, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

// North Indian Kundli houses layout (4x4 grid)
// Row 0: H12, H1, H2, H3
// Row 1: H11, center-TL, center-TR, H4
// Row 2: H10, center-BL, center-BR, H5
// Row 3: H9, H8, H7, H6

const HOUSE_GRID_POSITIONS: Record<number, [number, number]> = {
  1: [0, 1], 2: [0, 2], 3: [0, 3], 4: [1, 3], 5: [2, 3],
  6: [3, 3], 7: [3, 2], 8: [3, 1], 9: [3, 0], 10: [2, 0],
  11: [1, 0], 12: [0, 0],
}

const PLANET_ABBR: Record<string, string> = {
  Sun: '☀', Moon: '☾', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: 'Ra', Ketu: 'Ke',
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#B8860B', Moon: '#5B8C8C', Mercury: '#4E7D4E',
  Venus: '#C47A7A', Mars: '#B5451B', Jupiter: '#7B4C8E',
  Saturn: '#555', Rahu: '#1B4E7B', Ketu: '#7B1B1B',
}

function NorthIndianKundli({ chart, lang }: { chart: ChartData; lang: string }) {
  // Map house number -> list of planets in that house
  const housePlanets: Record<number, PlanetPosition[]> = {}
  for (let i = 1; i <= 12; i++) housePlanets[i] = []

  for (const planet of chart.planets) {
    const house = ((planet.rashi_index - chart.lagna_rashi_index + 12) % 12) + 1
    housePlanets[house].push(planet)
  }

  const cellSize = 80

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
        border: '2px solid var(--color-plum-300)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
        width: 'fit-content',
        margin: '0 auto',
      }}>
        {Array.from({ length: 16 }, (_, idx) => {
          const row = Math.floor(idx / 4)
          const col = idx % 4
          const isCenterTL = row === 1 && col === 1
          const isCenterTR = row === 1 && col === 2
          const isCenterBL = row === 2 && col === 1
          const isCenterBR = row === 2 && col === 2

          if (isCenterTL || isCenterTR || isCenterBL || isCenterBR) {
            // Center triangles — draw diagonal lines using borders
            return (
              <div key={idx} style={{
                background: 'var(--color-cream)',
                border: '1px solid var(--color-plum-200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {/* Taarvya AI brand watermark in center */}
                {isCenterTL && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gridColumn: '2 / 4', gridRow: '2 / 4',
                  }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-plum-200)' }}>✦</span>
                  </div>
                )}
              </div>
            )
          }

          // Find which house this grid cell corresponds to
          let houseNum = 0
          for (const [h, [r, c]] of Object.entries(HOUSE_GRID_POSITIONS)) {
            if (r === row && c === col) { houseNum = parseInt(h); break }
          }

          const isLagna = houseNum === 1
          const planets = housePlanets[houseNum] || []

          return (
            <div
              key={idx}
              style={{
                border: '1px solid var(--color-plum-200)',
                padding: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                background: isLagna ? 'rgba(155,142,196,0.08)' : 'var(--color-ivory)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: cellSize,
              }}
            >
              {/* House number */}
              <span style={{
                position: 'absolute', top: 2, right: 3,
                fontSize: '0.55rem', color: 'var(--color-plum-300)',
                fontWeight: 400,
              }}>
                {houseNum || ''}
              </span>

              {/* Lagna indicator */}
              {isLagna && (
                <span style={{
                  position: 'absolute', top: 2, left: 3,
                  fontSize: '0.5rem', color: 'var(--color-lavender-500)',
                  fontWeight: 600,
                }}>As</span>
              )}

              {/* Planets */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '1px',
                alignItems: 'center', justifyContent: 'center',
                marginTop: '0.75rem', padding: '0 2px',
              }}>
                {planets.map((p) => (
                  <div
                    key={p.name}
                    title={`${p.name}: ${p.rashi_name} ${p.degree_in_rashi.toFixed(1)}°${p.retrograde ? ' (R)' : ''}`}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: PLANET_COLORS[p.name] || 'var(--color-plum-700)',
                      lineHeight: 1.4,
                      cursor: 'default',
                    }}
                  >
                    {PLANET_ABBR[p.name] || p.name.slice(0, 2)}{p.retrograde ? '®' : ''}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
        justifyContent: 'center', marginTop: '1rem',
      }}>
        {Object.entries(PLANET_ABBR).map(([name, abbr]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: PLANET_COLORS[name] }}>{abbr}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-plum-400)' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanetRow({ planet, lang }: { planet: PlanetPosition; lang: string }) {
  const isKn = lang === 'kn'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.625rem 0.875rem',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-ivory)',
      fontSize: '0.8125rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span style={{ fontSize: '1rem', color: PLANET_COLORS[planet.name] }}>{PLANET_ABBR[planet.name]}</span>
        <span style={{ fontWeight: 500, color: 'var(--color-plum-800)' }}>{planet.name}</span>
      </div>
      <div style={{ color: 'var(--color-plum-700)' }}>
        {isKn ? planet.rashi_name_kn : planet.rashi_name}
        <span style={{ color: 'var(--color-plum-400)', marginLeft: '0.25rem' }}>
          {planet.degree_in_rashi.toFixed(2)}°
        </span>
      </div>
      <div style={{ color: 'var(--color-plum-600)' }}>
        {isKn ? planet.nakshatra_name_kn : planet.nakshatra_name} P{planet.pada}
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {planet.retrograde && (
          <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.65rem' }}>R</span>
        )}
        <span style={{ color: 'var(--color-plum-400)', fontSize: '0.7rem' }}>{planet.nakshatra_lord}</span>
      </div>
    </div>
  )
}

export default function KundliPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLang()

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.get(id!),
  })

  const { data: chart, isLoading, error, refetch } = useQuery({
    queryKey: ['chart', id],
    queryFn: async () => {
      if (profile?.cached_chart) return profile.cached_chart
      return chartApi.calculate(id!)
    },
    enabled: !!id,
  })

  const calculateMutation = useMutation({
    mutationFn: () => chartApi.calculate(id!),
    onSuccess: () => { refetch(); toast.success('Chart calculated!') },
    onError: () => toast.error('Calculation failed'),
  })

  if (isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--color-plum-200)', borderTopColor: 'var(--color-plum-600)', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-plum-500)' }}>Calculating your birth chart...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <AlertTriangle size={40} style={{ color: 'var(--color-gold-500)', marginBottom: '1rem' }} />
      <h2 style={{ color: 'var(--color-plum-900)' }}>Chart calculation failed</h2>
      <p style={{ color: 'var(--color-plum-500)' }}>Please check that your birth details are correct.</p>
      <button className="btn btn-primary" onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending}>
        {calculateMutation.isPending && <Loader size={14} className="spin" />}
        Retry
      </button>
    </div>
  )

  if (!chart) return null

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.25rem', color: 'var(--color-plum-900)' }}>
              {profile?.name}'s {t.kundli_title}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-plum-500)', fontSize: '0.9rem' }}>
              {chart.date_of_birth} · {chart.time_of_birth} · {chart.timezone_str}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to={`/profile/${id}/edit`} className="btn btn-secondary btn-sm">
              <Edit size={14} /> Edit
            </Link>
            <Link to={`/profile/${id}/reports`} className="btn btn-primary btn-sm">
              View Reports <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Key facts row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          {[
            { label: t.lagna, value: language === 'kn' ? chart.lagna_rashi_name_kn : chart.lagna_rashi_name, sub: `${chart.lagna_degree.toFixed(2)}°` },
            { label: t.moon_sign, value: language === 'kn' ? chart.moon_rashi_kn : chart.moon_rashi },
            { label: t.nakshatra, value: language === 'kn' ? chart.moon_nakshatra_kn : chart.moon_nakshatra },
            { label: t.pada, value: `Pada ${chart.moon_pada}`, sub: `${chart.moon_nakshatra_lord} rules` },
            { label: t.ayanamsha, value: `${chart.ayanamsha.toFixed(4)}°`, sub: chart.ayanamsha_name },
          ].map(({ label, value, sub }) => (
            <div key={label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-plum-900)' }}>{value}</div>
              {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-plum-400)', marginTop: '0.125rem' }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* North Indian Kundli */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 1.25rem', color: 'var(--color-plum-900)' }}>
              {t.kundli_title} (North Indian Style)
            </h2>
            <NorthIndianKundli chart={chart} lang={language} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-plum-400)', textAlign: 'center', lineHeight: 1.5 }}>
              Whole Sign houses · Lahiri ayanamsha · As = Ascendant/Lagna
            </p>
          </div>

          {/* Planetary positions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 1rem', color: 'var(--color-plum-900)' }}>
              {t.planets}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              marginBottom: '0.5rem',
              fontSize: '0.7rem',
              color: 'var(--color-plum-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <div>Planet</div><div>Sign</div><div>Nakshatra</div><div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {chart.planets.map((p) => (
                <PlanetRow key={p.name} planet={p} lang={language} />
              ))}
            </div>

            {/* Lagna row */}
            <div style={{
              marginTop: '0.5rem',
              padding: '0.625rem 0.875rem',
              background: 'var(--color-lavender-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-lavender-200)',
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1.5fr 0.8fr',
              gap: '0.5rem',
              fontSize: '0.8125rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ color: 'var(--color-lavender-500)' }}>↑</span>
                <span style={{ fontWeight: 500, color: 'var(--color-plum-800)' }}>Lagna</span>
              </div>
              <div style={{ color: 'var(--color-plum-700)' }}>
                {language === 'kn' ? chart.lagna_rashi_name_kn : chart.lagna_rashi_name}
                <span style={{ color: 'var(--color-plum-400)', marginLeft: '0.25rem' }}>
                  {chart.lagna_degree.toFixed(2)}°
                </span>
              </div>
              <div style={{ color: 'var(--color-plum-500)', fontSize: '0.75rem' }}>Ascendant</div>
              <div></div>
            </div>
          </div>
        </div>

        {/* Notes / warnings */}
        {chart.notes.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--color-gold-50)',
            border: '1px solid var(--color-gold-200)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={16} style={{ color: 'var(--color-gold-600)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-plum-800)', marginBottom: '0.375rem' }}>{t.calculation_notes}</p>
                {chart.notes.map((note, i) => (
                  <p key={i} style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-plum-600)', lineHeight: 1.6 }}>{note}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/profile/${id}/reports`} className="btn btn-primary">
            View Full Reports
          </Link>
          <Link to={`/profile/${id}/dasha`} className="btn btn-secondary">
            Dasha Timeline
          </Link>
          <button className="btn btn-secondary" onClick={() => toast('PDF download coming soon!')}>
            <Download size={14} /> Download PDF
          </button>
        </div>

        {/* Julian day metadata */}
        <div style={{ marginTop: '2rem', padding: '0.875rem', background: 'var(--color-ivory-dark)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>
            Julian Day: {chart.julian_day} · Ayanamsha: {chart.ayanamsha.toFixed(6)}° ({chart.ayanamsha_name}) ·
            Coordinates: {chart.latitude}°N {chart.longitude}°E · Timezone: {chart.timezone_str}
          </p>
        </div>
      </div>
    </div>
  )
}
