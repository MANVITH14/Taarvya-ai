import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportApi, type SavedReport } from '@/lib/api'
import { useLang } from '@/contexts/LangContext'
import { Download, Trash2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const REPORT_ICONS: Record<string, string> = {
  personality: '🌟', relationships: '💕', career: '🏆',
  finances: '💰', education: '📚', family: '🏠', yearly: '🗓',
}

function ReportCard({ report, onDelete }: { report: SavedReport; onDelete: () => void }) {
  const { language } = useLang()
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{REPORT_ICONS[report.report_type] || '📄'}</span>
          <div>
            <h3 style={{ margin: '0 0 0.2rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-plum-900)' }}>
              {report.content?.title || report.report_type}
            </h3>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>
                {format(new Date(report.created_at), 'dd MMM yyyy')}
              </span>
              {report.ai_generated && <span className="badge badge-lavender" style={{ fontSize: '0.65rem' }}>AI</span>}
              <span className="badge badge-plum" style={{ fontSize: '0.65rem' }}>{report.language.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('PDF download coming soon!')}>
            <Download size={13} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} style={{ color: '#DC2626' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-plum-600)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {report.content?.summary}
      </p>
    </div>
  )
}

export default function SavedReportsPage() {
  const { t } = useLang()
  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report deleted')
    },
  })

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>
            Saved Reports
          </h1>
          <p style={{ margin: 0, color: 'var(--color-plum-500)' }}>Your saved astrology interpretations</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <BookOpen size={40} style={{ color: 'var(--color-lavender-300)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-plum-500)', fontSize: '1rem' }}>No saved reports yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onDelete={() => deleteMutation.mutate(r.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
