import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Star, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import toast from 'react-hot-toast'

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { t, toggleLanguage } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    navigate('/')
    toast.success('Signed out successfully')
  }

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: t.nav_dashboard },
        { to: '/compatibility', label: t.nav_compatibility },
        { to: '/saved-reports', label: t.nav_reports },
      ]
    : []

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav style={{
      background: 'rgba(253,250,245,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(155,142,196,0.18)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container-app" style={{ display: 'flex', alignItems: 'center', height: 64, gap: '1.5rem' }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-plum-600), var(--color-lavender-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(78,46,94,0.25)',
          }}>
            <Star size={18} color="#fff" fill="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-plum-900)',
            letterSpacing: '-0.01em',
          }}>
            {t.brand}
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }} className="hidden-mobile">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive(link.to) ? 'var(--color-plum-700)' : 'var(--color-plum-500)',
                background: isActive(link.to) ? 'var(--color-plum-50)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="btn btn-ghost btn-sm"
            title="Toggle language"
            style={{ fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.02em' }}
          >
            {t.language_toggle}
          </button>

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.375rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-plum-50)',
                  border: '1.5px solid var(--color-plum-200)',
                  cursor: 'pointer',
                  color: 'var(--color-plum-700)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-plum-400), var(--color-lavender-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden-mobile" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    onClick={() => setUserMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-modal)',
                    border: '1px solid rgba(155,142,196,0.2)',
                    minWidth: 180,
                    zIndex: 20,
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(155,142,196,0.12)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-plum-900)' }}>{user?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)', marginTop: 2 }}>{user?.email}</div>
                    </div>
                    {[
                      { to: '/dashboard', icon: LayoutDashboard, label: t.nav_dashboard },
                      { to: '/settings', icon: Settings, label: t.nav_settings },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.6rem 1rem',
                          color: 'var(--color-plum-700)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-plum-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.6rem 1rem',
                        width: '100%',
                        color: '#DC2626',
                        background: 'transparent',
                        border: 'none',
                        borderTop: '1px solid rgba(155,142,196,0.12)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut size={15} />
                      {t.nav_logout}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }} className="hidden-mobile">
              <Link to="/login" className="btn btn-secondary btn-sm">{t.nav_login}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t.nav_register}</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="btn btn-ghost btn-sm show-mobile"
            style={{ padding: '0.375rem' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: '#fff',
          borderTop: '1px solid rgba(155,142,196,0.18)',
          padding: '1rem',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '0.625rem 0.75rem',
                color: 'var(--color-plum-700)', textDecoration: 'none',
                fontSize: '0.9375rem', fontWeight: 500,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>{t.nav_login}</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>{t.nav_register}</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
