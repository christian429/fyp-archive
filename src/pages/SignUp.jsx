import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, User, Mail, Lock, UploadCloud, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient.js'

export default function SignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // no "role" and no "department" here on purpose — role is
          // always 'student' server-side, and department is now
          // collected per-project at upload time instead (US-02)
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(
      'Account created! Check your email to verify your address before logging in.'
    )
    setTimeout(() => navigate('/login'), 2500)
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
              <h1>Create Your Account</h1>
              <p className="subtitle">Register to access the School Archive System</p>
            </div>

            <form onSubmit={handleSignUp}>
              <label htmlFor="fullName">Full Name</label>
              <div className="input-icon-wrap">
                <User size={16} />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Register Account'}
              </button>

              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
            </form>

            <p className="link-row">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>

          <div className="auth-feature-strip">
            <span className="auth-feature-strip-item">
              <UploadCloud size={14} /> Upload your project
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
