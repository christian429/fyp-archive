import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { supabase } from '../supabaseClient.js'

export default function Archive() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [profile, setProfile] = useState(null)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [year, setYear] = useState('')
  const [institution, setInstitution] = useState('')
  const [department, setDepartment] = useState('')

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    loadProfile()
  }, [navigate])

  useEffect(() => {
    setLoading(true)
    setError('')

    const handle = setTimeout(async () => {
      let q = supabase
        .from('projects')
        .select('id, title, year, institution, department, supervisor, abstract, file_name, file_path, profiles:student_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (query.trim()) {
        const term = query.trim().replace(/[%_]/g, '')
        q = q.or(`title.ilike.%${term}%,abstract.ilike.%${term}%`)
      }
      if (year.trim()) q = q.eq('year', Number(year))
      if (institution.trim()) q = q.ilike('institution', `%${institution.trim()}%`)
      if (department.trim()) q = q.ilike('department', `%${department.trim()}%`)

      const { data, error: queryError } = await q

      if (queryError) setError(queryError.message)
      else setResults(data || [])
      setLoading(false)
    }, 400)

    return () => clearTimeout(handle)
  }, [query, year, institution, department])

  async function handleDownload(project) {
    setDownloadingId(project.id)
    const { data, error: urlError } = await supabase.storage
      .from('project-reports')
      .createSignedUrl(project.file_path, 60)

    setDownloadingId(null)

    if (urlError) {
      setError(urlError.message)
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <AppShell profile={profile}>
      <div className="page-header">
        <h1>Project Archive</h1>
        <p className="subtitle">Search and browse archived final year projects.</p>
      </div>

      <div className="archive-layout">
        <aside className="filters-card">
          <h3>Filters</h3>

          <label htmlFor="titleSearch">Keyword</label>
          <input
            id="titleSearch"
            type="text"
            placeholder="Title or abstract..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label htmlFor="yearFilter">Year</label>
          <input
            id="yearFilter"
            type="number"
            placeholder="e.g. 2025"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />

          <label htmlFor="institutionFilter">Institution</label>
          <input
            id="institutionFilter"
            type="text"
            placeholder="e.g. Bayero University"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />

          <label htmlFor="deptFilter">Department</label>
          <input
            id="deptFilter"
            type="text"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </aside>

        <div className="content-card">
          {error && <p className="error">{error}</p>}
          {loading && <p className="hint-text">Searching...</p>}
          {!loading && results.length === 0 && (
            <p className="hint-text">No projects match your search.</p>
          )}

          {!loading && results.length > 0 && (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Institution</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Author</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <p className="result-title">{project.title}</p>
                      {project.abstract && (
                        <p className="result-abstract">{project.abstract}</p>
                      )}
                    </td>
                    <td>{project.institution}</td>
                    <td>{project.department}</td>
                    <td>{project.year}</td>
                    <td>{project.profiles?.full_name || 'Unknown'}</td>
                    <td>
                      <button
                        type="button"
                        className="table-download-btn"
                        disabled={downloadingId === project.id}
                        onClick={() => handleDownload(project)}
                      >
                        <Download size={13} />
                        {downloadingId === project.id ? 'Preparing...' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
