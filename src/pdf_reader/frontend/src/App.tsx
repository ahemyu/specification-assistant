import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TabNavigation } from './components/TabNavigation'
import { UploadView } from './components/views/UploadView'
import { ExtractionView } from './components/views/ExtractionView'
import { QAView } from './components/views/QAView'
import { Notifications } from './components/Notifications'
import './styles/styles.css'
import './styles/modules/base.css'
import './styles/modules/utilities.css'
import './styles/modules/navigation.css'
import './styles/modules/upload.css'
import './styles/modules/modals.css'
import './styles/modules/notifications.css'

function App() {
  return (
    <BrowserRouter>
      <Notifications />
      <div className="container">
        <header>
          <h1>Spec Assistant</h1>
          <p className="subtitle">Upload your PDF files and use LLMs to extract keys or ask questions</p>
        </header>

        <TabNavigation />

        <main>
          <Routes>
            <Route path="/" element={<UploadView />} />
            <Route path="/extract" element={<ExtractionView />} />
            <Route path="/qa" element={<QAView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
