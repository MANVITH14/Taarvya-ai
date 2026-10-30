import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, Loader, CheckCircle } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function PasswordResetPage() {
  const { t } = useLang()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.requestPasswordReset(data.email)
      setSent(true)
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail
      toast.error(msg || 'Failed to send reset link')
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem 1rem',
      background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(155,142,196,0.1), transparent), var(--color-ivory)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-plum-600), var(--color-lavender-500))',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
            boxShadow: '0 4px 16px rgba(78,46,94,0.25)',
          }}>
            <Star size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '0 0 0.375rem', color: 'var(--color-plum-900)' }}>
            {t.password_reset_title}
          </h1>
          <p style={{ color: 'var(--color-plum-500)', margin: 0, fontSize: '0.9375rem' }}>{t.password_reset_sub}</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-plum-500)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-plum-700)', fontWeight: 500 }}>{t.reset_link_sent}</p>
              <Link to="/login" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">{t.email_label}</label>
                <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com" id="reset-email" />
                {errors.email && <p className="error-text">{errors.email.message}</p>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting && <Loader size={16} className="spin" />}
                {t.send_reset_btn}
              </button>
              <Link to="/login" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-plum-500)', textDecoration: 'none' }}>
                {t.back} to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
