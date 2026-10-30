import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { profileApi, chartApi, type CompatibilityReport } from '@/lib/api'
import { useLang } from '@/contexts/LangContext'
import { Loader, Users, AlertCircle, Heart } from 'lucide-react'

export default function CompatibilityPage() {
  const { t } = useLang()
  const [profile1, setProfile1] = useState('')
  const [profile2, setProfile2] = useState('')
  const [report, setReport] = useState<CompatibilityReport | null>(null)

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.list,
  })

  const compareMutation = useMutation({
    mutationFn: () => chartApi.compatibility(profile1, profile2),
    onSuccess: (data) => setReport(data),
  })

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>
            {t.compatibility_title}
          </h1>
          <p style={{ margin: 0, color: 'var(--color-plum-500)' }}>{t.compatibility_sub}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--color-lavender-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-lavender-200)', marginBottom: '1.5rem' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-lavender-500)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-plum-600)', lineHeight: 1.55 }}>
            {t.disclaimer_text} Compatibility analysis is a cultural tradition and should not determine relationship decisions.
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="label">{t.select_profile_1}</label>
              <select className="input" value={profile1} onChange={(e) => setProfile1(e.target.value)} id="profile1">
                <option value="">Select profile...</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.select_profile_2}</label>
              <select className="input" value={profile2} onChange={(e) => setProfile2(e.target.value)} id="profile2">
                <option value="">Select profile...</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            disabled={!profile1 || !profile2 || profile1 === profile2 || compareMutation.isPending}
            onClick={() => compareMutation.mutate()}
            id="compare-btn"
          >
            {compareMutation.isPending ? <Loader size={16} className="spin" /> : <Users size={16} />}
            {t.compare_btn}
          </button>
        </div>

        {profiles.length < 2 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-plum-500)' }}>
            You need at least 2 birth profiles to compare. <a href="/profile/new" style={{ color: 'var(--color-plum-600)' }}>Add profiles</a>
          </div>
        )}

        {report && (
          <div className="card animate-fade-in" style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Heart size={32} style={{ color: '#C47A7A', marginBottom: '0.75rem' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-plum-900)' }}>
                {report.score}<span style={{ fontSize: '1.5rem' }}>/36</span>
              </div>
              <p style={{ color: 'var(--color-plum-500)', margin: '0.5rem 0 0' }}>{t.compatibility_score}</p>
            </div>
            <p style={{ color: 'var(--color-plum-700)', lineHeight: 1.7, margin: '0 0 1rem' }}>{report.summary}</p>
            <div style={{ padding: '0.75rem', background: 'var(--color-ivory)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>
              {report.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
