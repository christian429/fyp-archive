import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive, LayoutDashboard, UploadCloud, ShieldAlert, LogOut, Search } from 'lucide-react'
import { supabase } from '../supabaseClient.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/archive', label: 'Archive Explorer', Icon: Archive },
]

export default function AppShell({ profile, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const term = searchTerm.trim()
    navigate(term ? `/archive?q=${encodeURIComponent(term)}` : '/archive')
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Archive size={18} />
          </div>
          <div>
            <p className="sidebar-brand-name">FYP Archive</p>
            <p className="sidebar-brand-tag">Project repository</p>
          </div>
        </div>

        <Link to="/upload" className="sidebar-cta">
          <UploadCloud size={16} /> Upload project
        </Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              <Icon size={17} /> {label}
            </Link>
          ))}
          {profile?.role === 'admin' && profile?.is_approved && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <ShieldAlert size={17} /> Admin panel
            </Link>
          )}
        </nav>

        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={16} /> Log out
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="topbar-user">
            <div className="topbar-avatar">{initials}</div>
            <div>
              <p className="topbar-user-name">{profile?.full_name || 'Loading...'}</p>
              {profile?.role === 'admin' && profile?.is_approved && <span className="role-pill">Admin</span>}
            </div>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
