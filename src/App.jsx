import { Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Archive from './pages/Archive.jsx'
import AdminPanel from './pages/AdminPanel.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}
