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
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
  preferred_language: z.enum(['en', 'kn']),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferred_language: 'en' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.email, data.password, data.full_name, data.preferred_language)
      toast.success('Account created! Welcome to Taarvya AI')
      navigate('/profile/new')
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail
      toast.error(msg || 'Registration failed. Please try again.')
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
      <div style={{ width: '100%', maxWidth: 440 }}>
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
            {t.register_title}
          </h1>
          <p style={{ color: 'var(--color-plum-500)', margin: 0, fontSize: '0.9375rem' }}>{t.register_sub}</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label className="label">{t.name_label}</label>
              <input {...register('full_name')} className={`input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Arjun Sharma" autoComplete="name" id="full_name" />
              {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">{t.email_label}</label>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com" autoComplete="email" id="reg-email" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">{t.password_label}</label>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} type={showPw ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 8 chars with uppercase & number"
                  autoComplete="new-password" id="reg-password"
                  style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-plum-400)', padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">{t.confirm_password_label}</label>
              <input {...register('confirm_password')} type={showPw ? 'text' : 'password'}
                className={`input ${errors.confirm_password ? 'input-error' : ''}`}
                placeholder="••••••••" autoComplete="new-password" id="confirm-password" />
              {errors.confirm_password && <p className="error-text">{errors.confirm_password.message}</p>}
            </div>

            <div>
              <label className="label">{t.language_pref}</label>
              <select {...register('preferred_language')} className="input" id="preferred-language">
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="register-submit" style={{ marginTop: '0.25rem' }}>
              {isSubmitting && <Loader size={16} className="spin" />}
              {t.register_btn}
            </button>
          </form>

          <div className="section-divider" style={{ margin: '1.5rem 0 1rem' }}>{t.or}</div>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-plum-500)', margin: 0 }}>
            {t.have_account}{' '}
            <Link to="/login" style={{ color: 'var(--color-plum-600)', fontWeight: 500, textDecoration: 'none' }}>
              {t.login_btn}
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-plum-400)', marginTop: '1rem' }}>
          By creating an account, you agree to our{' '}
          <Link to="/terms" style={{ color: 'var(--color-plum-500)' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: 'var(--color-plum-500)' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
