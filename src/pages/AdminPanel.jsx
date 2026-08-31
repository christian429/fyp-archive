import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, TriangleAlert, Check, PlusCircle } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { supabase } from '../supabaseClient.js'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [filterFlagged, setFilterFlagged] = useState(false)

  const [newInstitution, setNewInstitution] = useState('')
  const [institutionMsg, setInstitutionMsg] = useState('')
  const [institutionError, setInstitutionError] = useState('')
  const [addingInstitution, setAddingInstitution] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (!data || data.role !== 'admin' || !data.is_approved) {
        navigate('/dashboard')
        return
      }
      setProfile(data)
      setCheckingAccess(false)
    }
    checkAccess()
  }, [navigate])

  async function loadProjects() {
    setLoading(true)
    setError('')
    let q = supabase
      .from('projects')
      .select('id, title, year, institution, department, supervisor, is_flagged, created_at, profiles:student_id(full_name, email)')
      .order('created_at', { ascending: false })

    if (filterFlagged) q = q.eq('is_flagged', true)

    const { data, error: queryError } = await q
    if (queryError) setError(queryError.message)
    else setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!checkingAccess) loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAccess, filterFlagged])

  async function handleClearFlag(project) {
    setBusyId(project.id)
    const { error: updateError } = await supabase
      .from('projects')
      .update({ is_flagged: false })
      .eq('id', project.id)
    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, is_flagged: false } : p)))
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    setBusyId(project.id)
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', project.id)
    setBusyId(null)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setProjects((prev) => prev.filter((p) => p.id !== project.id))
  }

  async function handleAddInstitution(e) {
    e.preventDefault()
    setInstitutionMsg('')
    setInstitutionError('')

    const name = newInstitution.trim()
    if (!name) return

    setAddingInstitution(true)
    const { error: insertError } = await supabase.from('institutions').insert({ name })
    setAddingInstitution(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setInstitutionError('That institution is already in the list.')
      } else {
        setInstitutionError(insertError.message)
      }
      return
    }

    setInstitutionMsg(`"${name}" added — students will see it on the Upload page now.`)
    setNewInstitution('')
  }

  if (checkingAccess) {
    return (
      <AppShell profile={profile}>
        <p className="hint-text">Checking access...</p>
      </AppShell>
    )
  }

  return (
    <AppShell profile={profile}>
      <div className="page-header">
        <h1>Manage records</h1>
        <p className="subtitle">
          {projects.length} record{projects.length === 1 ? '' : 's'} in the archive
        </p>
      </div>

      <div className="content-card" style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Add an institution</h3>
        <p className="hint-text" style={{ marginBottom: 12 }}>
          Missing from the Upload page's dropdown? Add it here — it becomes available to
          every student immediately.
        </p>
        <form
          onSubmit={handleAddInstitution}
          style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="newInstitution" style={{ marginTop: 0 }}>
              Institution name
            </label>
            <input
              id="newInstitution"
              type="text"
              placeholder="e.g. Federal University of Environment and Technology"
              value={newInstitution}
              onChange={(e) => setNewInstitution(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={addingInstitution || !newInstitution.trim()}
            style={{ width: 'auto', marginTop: 0 }}
          >
            <PlusCircle size={15} /> {addingInstitution ? 'Adding...' : 'Add'}
          </button>
        </form>
        {institutionError && <p className="error">{institutionError}</p>}
        {institutionMsg && <p className="success">{institutionMsg}</p>}
      </div>

      <label className="checkbox-row" style={{ marginTop: 0, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={filterFlagged}
          onChange={(e) => setFilterFlagged(e.target.checked)}
        />
        Show only flagged (possible duplicate) submissions
      </label>

      {error && <p className="error">{error}</p>}

      <div className="content-card">
        {loading && <p className="hint-text">Loading records...</p>}
        {!loading && projects.length === 0 && <p className="hint-text">No records found.</p>}

        {!loading && projects.length > 0 && (
          <table className="results-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Institution</th>
                <th>Department</th>
                <th>Year</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <p className="result-title">
                      {project.title}
                      {project.is_flagged && (
                        <span className="flag-badge">
                          <TriangleAlert size={11} /> Flagged
                        </span>
                      )}
                    </p>
                  </td>
                  <td>
                    {project.profiles?.full_name}
                    <br />
                    <span className="hint-text">{project.profiles?.email}</span>
                  </td>
                  <td>{project.institution}</td>
                  <td>{project.department}</td>
                  <td>{project.year}</td>
                  <td>
                    <div className="admin-actions">
                      {project.is_flagged && (
                        <button
                          type="button"
                          className="table-download-btn admin-clear-btn"
                          disabled={busyId === project.id}
                          onClick={() => handleClearFlag(project)}
                        >
                          <Check size={13} /> Clear
                        </button>
                      )}
                      <button
                        type="button"
                        className="table-download-btn admin-delete-btn"
                        disabled={busyId === project.id}
                        onClick={() => handleDelete(project)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  )
}
