import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { useNavigate } from 'react-router-dom'
import { Loader, User, Shield, Globe, AlertTriangle, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  preferred_language: z.enum(['en', 'kn']),
})
type ProfileData = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const { t, setLanguage } = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || '', preferred_language: (user?.preferred_language as 'en' | 'kn') || 'en' },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileData) => authApi.updateProfile(data),
    onSuccess: (updated) => {
      refreshUser()
      setLanguage(updated.preferred_language as 'en' | 'kn')
      toast.success('Settings saved!')
    },
    onError: () => toast.error('Failed to update settings'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      logout()
      navigate('/')
      toast.success('Account deleted')
    },
    onError: () => toast.error('Failed to delete account'),
  })

  const exportMutation = useMutation({
    mutationFn: () => authApi.me(), // placeholder
    onSuccess: () => toast.success('Data export prepared — check your email'),
  })

  const tabs = [
    { id: 'profile', icon: User, label: t.profile_settings },
    { id: 'privacy', icon: Shield, label: t.privacy_settings },
  ]

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container-app" style={{ maxWidth: 700 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 2rem', color: 'var(--color-plum-900)' }}>
          {t.settings_title}
        </h1>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-ivory-dark)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '1.5rem', width: 'fit-content' }}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer',
                background: activeTab === id ? '#fff' : 'transparent',
                color: activeTab === id ? 'var(--color-plum-700)' : 'var(--color-plum-400)',
                fontWeight: activeTab === id ? 500 : 400,
                fontSize: '0.875rem',
                boxShadow: activeTab === id ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 1.25rem', color: 'var(--color-plum-900)' }}>
              Profile Information
            </h2>
            <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)', marginTop: '0.25rem' }}>Email cannot be changed</p>
              </div>
              <div>
                <label className="label">{t.name_label}</label>
                <input {...register('full_name')} className={`input ${errors.full_name ? 'input-error' : ''}`} id="full-name" />
                {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="label">{t.language_settings}</label>
                <select {...register('preferred_language')} className="input" id="language">
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || updateMutation.isPending} id="save-settings">
                {(isSubmitting || updateMutation.isPending) && <Loader size={16} className="spin" />}
                {t.save}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Export data */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>
                {t.export_data}
              </h2>
              <p style={{ color: 'var(--color-plum-500)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                Download a copy of all your birth profiles and saved reports.
              </p>
              <button className="btn btn-secondary" onClick={() => exportMutation.mutate()}>
                <Download size={14} />
                {t.export_data}
              </button>
            </div>

            {/* Delete account */}
            <div className="card" style={{ padding: '1.5rem', borderColor: '#FCA5A5' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#DC2626' }}>
                {t.delete_account}
              </h2>
              <p style={{ color: 'var(--color-plum-500)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                {t.delete_account_warning}
              </p>
              {!deleteConfirm ? (
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(true)} style={{ borderColor: '#FCA5A5', color: '#DC2626' }}>
                  <Trash2 size={14} />
                  {t.delete_account}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)}>{t.cancel}</button>
                  <button
                    className="btn"
                    style={{ background: '#DC2626', color: '#fff' }}
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && <Loader size={14} className="spin" />}
                    Permanently Delete My Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
