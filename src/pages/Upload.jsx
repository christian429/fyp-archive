import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, TriangleAlert, FileText } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import SearchableSelect from '../components/SearchableSelect.jsx'
import { DEPARTMENTS } from '../data/departments.js'
import { supabase } from '../supabaseClient.js'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_FILE_MB = 20

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [department, setDepartment] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [abstract, setAbstract] = useState('')
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const [duplicates, setDuplicates] = useState([])
  const [checkingDupes, setCheckingDupes] = useState(false)

  const [institutionOptions, setInstitutionOptions] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentYear = new Date().getFullYear()
  const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => currentYear - i)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    loadProfile()
  }, [navigate])

  useEffect(() => {
    async function loadInstitutions() {
      const { data } = await supabase.from('institutions').select('name').order('name')
      setInstitutionOptions((data || []).map((row) => row.name))
    }
    loadInstitutions()
  }, [])

  // Debounced duplicate-title check (US-03) — fires ~500ms after typing stops
  useEffect(() => {
    if (title.trim().length < 5) {
      setDuplicates([])
      return
    }
    setCheckingDupes(true)
    const handle = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('find_similar_titles', {
        input_title: title.trim(),
      })
      if (!rpcError) setDuplicates(data || [])
      setCheckingDupes(false)
    }, 500)
    return () => clearTimeout(handle)
  }, [title])

  function validateAndSetFile(selected) {
    setError('')
    if (!selected) return
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Only PDF and DOCX files are accepted.')
      return
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Max size is ${MAX_FILE_MB}MB.`)
      return
    }
    setFile(selected)
  }

  function handleFileChange(e) {
    validateAndSetFile(e.target.files?.[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    validateAndSetFile(e.dataTransfer.files?.[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!file) {
      setError('Please attach your report (PDF or DOCX).')
      return
    }
    if (!institution) {
      setError('Please select your institution from the list.')
      return
    }
    if (!department) {
      setError('Please select your department from the list.')
      return
    }
    if (!profile) {
      setError('Could not load your profile. Try refreshing the page.')
      return
    }

    setLoading(true)

    const filePath = `${profile.id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-reports')
      .upload(filePath, file)

    if (uploadError) {
      setLoading(false)
      setError(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from('projects').insert({
      student_id: profile.id,
      title: title.trim(),
      supervisor: supervisor.trim(),
      year: Number(year),
      institution: institution.trim(),
      department: department.trim(),
      abstract: abstract.trim(),
      file_path: filePath,
      file_name: file.name,
      is_flagged: duplicates.length > 0,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSuccess('Project uploaded successfully! It is now in the archive.')
    setTitle('')
    setInstitution('')
    setDepartment('')
    setSupervisor('')
    setYear(new Date().getFullYear())
    setAbstract('')
    setFile(null)
    setDuplicates([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AppShell profile={profile}>
      <div className="page-header">
        <h1>Upload project report</h1>
        <p className="subtitle">Add your final year project to the archive.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-layout">
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon">
              <UploadCloud size={26} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: 'var(--text)' }}>
              Drag and drop your report here
            </p>
            <p className="hint-text" style={{ margin: 0 }}>
              PDF or DOCX, up to {MAX_FILE_MB}MB
            </p>
            <input
              id="file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file && (
              <div className="dropzone-file" onClick={(e) => e.stopPropagation()}>
                <FileText size={15} />
                {file.name}
              </div>
            )}
          </div>

          <div className="content-card">
            <label htmlFor="title">Project Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. AI-Based Attendance System Using Facial Recognition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {checkingDupes && <p className="hint-text">Checking for similar titles...</p>}

            {duplicates.length > 0 && (
              <div className="warning-box">
                <div className="warning-title">
                  <TriangleAlert size={16} />
                  Similar titles already exist
                </div>
                <ul className="warning-list">
                  {duplicates.map((d) => (
                    <li key={d.id}>
                      {d.title} <span className="warning-year">({d.year})</span>
                    </li>
                  ))}
                </ul>
                <p className="warning-note">
                  You can still submit — this will be flagged for admin review.
                </p>
              </div>
            )}

            <label htmlFor="institution">Institution</label>
            <SearchableSelect
              id="institution"
              value={institution}
              onChange={setInstitution}
              options={institutionOptions}
              placeholder="Search for your institution..."
              emptyMessage="Not found — ask an admin to add it"
            />

            <label htmlFor="department">Department</label>
            <SearchableSelect
              id="department"
              value={department}
              onChange={setDepartment}
              options={DEPARTMENTS}
              placeholder="Search for your department..."
            />

            <div className="field-row">
              <div>
                <label htmlFor="supervisor">Supervisor</label>
                <input
                  id="supervisor"
                  type="text"
                  placeholder="e.g. Dr. Jane Doe"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="year">Year</label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label htmlFor="abstract">Abstract</label>
            <textarea
              id="abstract"
              rows={4}
              placeholder="A short summary of the project..."
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Submit Project'}
            </button>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
          </div>
        </div>
      </form>
    </AppShell>
  )
}
