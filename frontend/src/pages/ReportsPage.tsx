import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { chartApi, reportApi, profileApi, type Report } from '@/lib/api'
import { useLang } from '@/contexts/LangContext'
import { Loader, AlertCircle, BookOpen, Sparkles, Save, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { id: 'personality', icon: '🌟', label: 'Personality' },
  { id: 'relationships', icon: '💕', label: 'Relationships' },
  { id: 'career', icon: '🏆', label: 'Career' },
  { id: 'finances', icon: '💰', label: 'Finances' },
  { id: 'education', icon: '📚', label: 'Education' },
  { id: 'family', icon: '🏠', label: 'Family' },
  { id: 'yearly', icon: '🗓', label: 'Yearly Outlook' },
]

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>()
  const { language, t } = useLang()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<Report | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.get(id!),
  })

  const { data: chart } = useQuery({
    queryKey: ['chart', id],
    queryFn: () => chartApi.get(id!),
    enabled: !!id,
  })

  const generateMutation = useMutation({
    mutationFn: (type: string) => reportApi.generate(id!, type, language),
    onSuccess: (data) => {
      setCurrentReport(data)
      toast.success('Report generated!')
    },
    onError: () => toast.error('Failed to generate report'),
  })

  const saveMutation = useMutation({
    mutationFn: () => reportApi.save(id!, selectedType!, language, currentReport!),
    onSuccess: () => toast.success('Report saved to your account'),
    onError: () => toast.error('Failed to save report'),
  })

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link to={`/profile/${id}/kundli`} className="btn btn-ghost btn-sm">
            <ChevronLeft size={16} /> Back to Kundli
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.125rem', color: 'var(--color-plum-900)' }}>
              {t.reports_title}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-plum-500)', fontSize: '0.875rem' }}>{profile?.name}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem',
          background: 'var(--color-lavender-50)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-lavender-200)', marginBottom: '1.5rem',
        }}>
          <AlertCircle size={16} style={{ color: 'var(--color-lavender-500)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-plum-600)', lineHeight: 1.55 }}>
            {t.disclaimer_text}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Report type selector */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 0.875rem', color: 'var(--color-plum-900)' }}>
              Choose Report Type
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => {
                    setSelectedType(rt.id)
                    setCurrentReport(null)
                    generateMutation.mutate(rt.id)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: selectedType === rt.id ? 'var(--color-plum-50)' : '#fff',
                    border: `1.5px solid ${selectedType === rt.id ? 'var(--color-plum-300)' : 'rgba(155,142,196,0.15)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    color: 'var(--color-plum-800)',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{rt.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{rt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>Vedic astrology interpretation</div>
                  </div>
                  {selectedType === rt.id && generateMutation.isPending && (
                    <Loader size={14} className="spin" style={{ marginLeft: 'auto', color: 'var(--color-plum-500)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Report display */}
          <div>
            {generateMutation.isPending && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Sparkles size={32} style={{ color: 'var(--color-lavender-400)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-plum-600)', fontWeight: 500 }}>{t.generating}</p>
                <p style={{ color: 'var(--color-plum-400)', fontSize: '0.875rem' }}>Analyzing chart data...</p>
              </div>
            )}

            {currentReport && !generateMutation.isPending && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 0.25rem', color: 'var(--color-plum-900)' }}>
                      {currentReport.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {currentReport.ai_generated ? (
                        <span className="badge badge-lavender">AI Generated</span>
                      ) : (
                        <span className="badge badge-plum">Chart Data</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    <Save size={13} />
                    {t.save_report}
                  </button>
                </div>

                <p style={{ color: 'var(--color-plum-600)', lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
                  {currentReport.summary}
                </p>

                {currentReport.sections.map((section, i) => (
                  <div key={i} style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-plum-800)', margin: '0 0 0.5rem' }}>
                      {section.heading}
                    </h3>
                    <p style={{ color: 'var(--color-plum-600)', lineHeight: 1.7, fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {section.content}
                    </p>
                  </div>
                ))}

                {currentReport.key_themes?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-plum-800)', margin: '0 0 0.5rem' }}>Key Themes</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {currentReport.key_themes.map((theme, i) => (
                        <span key={i} className="badge badge-gold">{theme}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{
                  padding: '0.75rem', background: 'var(--color-ivory)', borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem', color: 'var(--color-plum-400)', lineHeight: 1.6,
                }}>
                  <BookOpen size={12} style={{ display: 'inline', marginRight: '0.375rem' }} />
                  {currentReport.disclaimer}
                </div>
              </div>
            )}

            {!currentReport && !generateMutation.isPending && (
              <div style={{
                textAlign: 'center', padding: '3rem 1.5rem',
                background: '#fff', borderRadius: 'var(--radius-xl)',
                border: '2px dashed rgba(155,142,196,0.25)',
              }}>
                <BookOpen size={32} style={{ color: 'var(--color-lavender-300)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--color-plum-500)', fontSize: '0.9375rem' }}>
                  Select a report type to generate an interpretation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
