import { Routes, Route } from 'react-router-dom'
import { TabNavigation } from './TabNavigation'
import { UploadView } from './views/UploadView'
import { ExtractionView } from './views/ExtractionView'
import { QAView } from './views/QAView'
import "../styles/modules/maincontainer.css";


export const MainContainer: React.FC = () => {
  return (
    <>
    

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main Routes */}
      <Routes>
        <Route path="/" element={<UploadView />} />
        <Route path="/extract" element={<ExtractionView />} />
        <Route path="/qa" element={<QAView />} />
      </Routes>
    </>
  )
}
