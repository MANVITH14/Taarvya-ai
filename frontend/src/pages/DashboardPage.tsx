import { Link } from 'react-router-dom'
import { Plus, Star, Calendar, MapPin, ChevronRight, User, Sparkles, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { profileApi, reportApi, type BirthProfile, type SavedReport } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { format } from 'date-fns'

function ProfileCard({ profile }: { profile: BirthProfile }) {
  const { t } = useLang()
  return (
    <div className="card animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-plum-200), var(--color-lavender-200))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <User size={18} style={{ color: 'var(--color-plum-600)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-display)', color: 'var(--color-plum-900)' }}>
              {profile.name}
            </h3>
            {profile.is_primary && <span className="badge badge-plum">Primary</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-plum-400)' }}>
              <Calendar size={12} /> {profile.date_of_birth}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-plum-400)' }}>
              <MapPin size={12} /> {profile.birthplace_name.split(',')[0]}
            </span>
          </div>
        </div>
      </div>
      {profile.cached_chart && (
        <div style={{
          background: 'var(--color-ivory)',
          borderRadius: 'var(--radius-md)',
          padding: '0.625rem 0.875rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.8rem',
        }}>
          <div><span style={{ color: 'var(--color-plum-400)' }}>Lagna: </span><span style={{ color: 'var(--color-plum-700)', fontWeight: 500 }}>{profile.cached_chart.lagna_rashi_name}</span></div>
          <div><span style={{ color: 'var(--color-plum-400)' }}>Moon: </span><span style={{ color: 'var(--color-plum-700)', fontWeight: 500 }}>{profile.cached_chart.moon_rashi}</span></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to={`/profile/${profile.id}/kundli`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          {t.view_kundli}
        </Link>
        <Link to={`/profile/${profile.id}/reports`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          {t.generate_report}
        </Link>
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: SavedReport }) {
  const REPORT_ICONS: Record<string, string> = {
    personality: '🌟', relationships: '💕', career: '🏆',
    finances: '💰', education: '📚', family: '🏠', yearly: '🗓',
  }
  return (
    <Link to={`/saved-reports`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
        <span style={{ fontSize: '1.25rem' }}>{REPORT_ICONS[report.report_type] || '📄'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-plum-800)' }}>
            {report.content?.title || report.report_type}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>
              {format(new Date(report.created_at), 'dd MMM yyyy')}
            </span>
            {report.ai_generated && <span className="badge badge-lavender" style={{ fontSize: '0.65rem' }}>AI</span>}
          </div>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--color-plum-300)' }} />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLang()

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.list,
  })

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.list(),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app">
        {/* Header */}
        <div style={{
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, var(--color-plum-50), var(--color-lavender-50))',
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem',
          border: '1px solid rgba(155,142,196,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, fontSize: '5rem' }}>
            ☀
          </div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: 'var(--color-plum-400)' }}>{greeting()},</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>
            {user?.full_name?.split(' ')[0]} ✨
          </h1>
          <p style={{ margin: '0', color: 'var(--color-plum-500)', fontSize: '0.9375rem' }}>{t.dashboard_sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Profiles section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0, color: 'var(--color-plum-900)' }}>
                {t.my_profiles}
              </h2>
              <Link to="/profile/new" className="btn btn-primary btn-sm">
                <Plus size={14} />
                {t.add_profile}
              </Link>
            </div>

            {profilesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1.5rem',
                background: '#fff', borderRadius: 'var(--radius-xl)',
                border: '2px dashed rgba(155,142,196,0.25)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌙</div>
                <p style={{ color: 'var(--color-plum-500)', margin: '0 0 1rem', fontSize: '0.9375rem' }}>{t.no_profiles}</p>
                <Link to="/profile/new" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  {t.add_profile}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
              </div>
            )}
          </div>

          {/* Reports section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0, color: 'var(--color-plum-900)' }}>
                {t.recent_reports}
              </h2>
              <Link to="/saved-reports" className="btn btn-ghost btn-sm">View all</Link>
            </div>

            {reportsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1.5rem',
                background: '#fff', borderRadius: 'var(--radius-xl)',
                border: '2px dashed rgba(155,142,196,0.25)',
              }}>
                <Sparkles size={32} style={{ color: 'var(--color-lavender-400)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--color-plum-500)', margin: '0 0 1rem', fontSize: '0.9375rem' }}>
                  No reports yet. View your Kundli and generate one!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reports.slice(0, 5).map((r) => <ReportCard key={r.id} report={r} />)}
              </div>
            )}

            {/* Quick actions */}
            {profiles.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-plum-700)', marginBottom: '0.75rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { icon: Star, label: 'View Kundli', to: `/profile/${profiles[0]?.id}/kundli` },
                    { icon: Clock, label: 'Dasha Timeline', to: `/profile/${profiles[0]?.id}/dasha` },
                    { icon: User, label: 'Kundli Matching', to: '/compatibility' },
                  ].map(({ icon: Icon, label, to }) => (
                    <Link key={to} to={to} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: '0.625rem' }}>
                      <Icon size={15} />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
