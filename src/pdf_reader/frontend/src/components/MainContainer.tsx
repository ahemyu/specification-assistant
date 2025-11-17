import { Routes, Route } from 'react-router-dom'
import { TabNavigation } from './TabNavigation'
import { UploadView } from './views/UploadView'
import { ExtractionView } from './views/ExtractionView'
import { QAView } from './views/QAView'
import { CompareView } from './views/CompareView'
import "../styles/modules/maincontainer.css";


export const MainContainer: React.FC = () => {
  return (
    <div className="main-content">
      {/* Header */}
      <header>
        <h1>Spec Assistant</h1>
        <p className="subtitle">
          Upload your PDF files and use LLMs to extract keys or ask questions
        </p>
      </header>

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main Routes */}
      <main>
        <Routes>
          <Route path="/" element={<UploadView />} />
          <Route path="/extract" element={<ExtractionView />} />
          <Route path="/qa" element={<QAView />} />
          <Route path="/compare" element={<CompareView />} />
        </Routes>
      </main>
    </div>
  )
}
