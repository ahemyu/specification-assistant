import { NavLink } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function TabNavigation() {
  const uploadedFileIds = useAppStore((state) => state.uploadedFileIds)
  const hasUploadedFiles = uploadedFileIds.length > 0

  return (
    <nav className="main-tabs">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `main-tab-btn ${isActive ? 'active' : ''}`
        }
        data-tab="upload"
      >
        Upload PDFs
      </NavLink>
      <NavLink
        to="/extract"
        className={({ isActive }) =>
          `main-tab-btn ${isActive ? 'active' : ''} ${!hasUploadedFiles ? 'disabled' : ''}`
        }
        data-tab="extract"
        data-tooltip={!hasUploadedFiles ? 'Upload PDFs first' : undefined}
        onClick={(e) => {
          if (!hasUploadedFiles) {
            e.preventDefault()
          }
        }}
      >
        Extract Keys
      </NavLink>
      <NavLink
        to="/qa"
        className={({ isActive }) =>
          `main-tab-btn ${isActive ? 'active' : ''} ${!hasUploadedFiles ? 'disabled' : ''}`
        }
        data-tab="qa"
        data-tooltip={!hasUploadedFiles ? 'Upload PDFs first' : undefined}
        onClick={(e) => {
          if (!hasUploadedFiles) {
            e.preventDefault()
          }
        }}
      >
        Ask Questions
      </NavLink>
    </nav>
  )
}
