import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UploadCloud, Search as SearchIcon, TriangleAlert } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { supabase } from '../supabaseClient.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ myUploads: 0, totalArchive: 0, flagged: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      const [{ count: myUploads }, { count: totalArchive }, recentRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase
          .from('projects')
          .select('id, title, year, created_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      let flagged = 0
      if (profileData?.role === 'admin' && profileData?.is_approved) {
        const { count } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('is_flagged', true)
        flagged = count || 0
      }

      setStats({ myUploads: myUploads || 0, totalArchive: totalArchive || 0, flagged })
      setRecent(recentRes.data || [])
      setLoading(false)
    }
    load()
  }, [navigate])

  if (loading) {
    return (
      <AppShell profile={profile}>
        <p className="hint-text">Loading dashboard...</p>
      </AppShell>
    )
  }

  return (
    <AppShell profile={profile}>
      <div className="page-header">
        <h1>Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</h1>
        <p className="subtitle">Here's what's happening in the archive.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card-label">Your uploads</p>
          <p className="stat-card-value">{stats.myUploads}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card-label">Total archive records</p>
          <p className="stat-card-value">{stats.totalArchive}</p>
        </div>
        {profile?.role === 'admin' && profile?.is_approved && (
          <div className="stat-card">
            <p className="stat-card-label">Flagged for review</p>
            <p className="stat-card-value">{stats.flagged}</p>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/upload" className="dashboard-link">
          <UploadCloud size={15} style={{ marginRight: 6 }} />
          Upload project report
        </Link>
        <Link to="/archive" className="dashboard-link dashboard-link-secondary">
          <SearchIcon size={15} style={{ marginRight: 6 }} />
          Browse archive
        </Link>
        {profile?.role === 'admin' && profile?.is_approved && stats.flagged > 0 && (
          <Link to="/admin" className="dashboard-link dashboard-link-secondary">
            <TriangleAlert size={15} style={{ marginRight: 6 }} />
            Review {stats.flagged} flagged item{stats.flagged === 1 ? '' : 's'}
          </Link>
        )}
      </div>

      <div className="content-card">
        <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Your recent uploads</h3>
        {recent.length === 0 ? (
          <p className="hint-text">
            You haven't uploaded anything yet — your submissions will show up here.
          </p>
        ) : (
          <div className="recent-list">
            {recent.map((p) => (
              <div key={p.id} className="recent-row">
                <span className="recent-row-title">{p.title}</span>
                <span className="recent-row-meta">{p.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
