import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail
      toast.error(msg || 'Invalid email or password')
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(155,142,196,0.1), transparent), var(--color-ivory)`,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            width: 52, height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-plum-600), var(--color-lavender-500))',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 16px rgba(78,46,94,0.25)',
          }}>
            <Star size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '0 0 0.375rem', color: 'var(--color-plum-900)' }}>
            {t.login_title}
          </h1>
          <p style={{ color: 'var(--color-plum-500)', margin: 0, fontSize: '0.9375rem' }}>{t.login_sub}</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label">{t.email_label}</label>
              <input
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                id="email"
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label">{t.password_label}</label>
                <Link to="/password-reset" style={{ fontSize: '0.8125rem', color: 'var(--color-plum-500)', textDecoration: 'none' }}>
                  {t.forgot_password}
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  id="password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-plum-400)',
                    padding: 0,
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="login-submit">
              {isSubmitting ? <Loader size={16} className="spin" /> : null}
              {t.login_btn}
            </button>
          </form>

          <div className="section-divider" style={{ margin: '1.5rem 0 1rem' }}>
            {t.or}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-plum-500)', margin: 0 }}>
            {t.no_account}{' '}
            <Link to="/register" style={{ color: 'var(--color-plum-600)', fontWeight: 500, textDecoration: 'none' }}>
              {t.nav_register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
