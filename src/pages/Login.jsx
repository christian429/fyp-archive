import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, LogIn, Mail, Lock, Search, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (loginError) {
      setError(loginError.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <div className="auth-topbar-logo">
          <Archive size={16} />
        </div>
        <span className="auth-topbar-name">FYP Archive</span>
      </div>

      <div className="auth-center">
        <div>
          <div className="container">
            <div className="header-block">
              <div className="logo-circle">
                <Archive size={22} />
              </div>
              <h1>Welcome back</h1>
              <p className="subtitle">Log in to the School Archive System</p>
            </div>

            <form onSubmit={handleLogin}>
              <label htmlFor="email">Institutional Email</label>
              <div className="input-icon-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                <LogIn size={16} />
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              {error && <p className="error">{error}</p>}
            </form>

            <p className="link-row">
              Don't have an account? <Link to="/signup">Register here</Link>
            </p>
          </div>

          <div className="auth-feature-strip">
            <span className="auth-feature-strip-item">
              <Search size={14} /> Search the archive
            </span>
            <span className="auth-feature-strip-item">
              <ShieldCheck size={14} /> Duplicate-title checks
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
