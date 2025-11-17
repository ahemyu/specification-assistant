import { BrowserRouter } from 'react-router-dom'
import { Notifications } from './components/Notifications'
import Sidebar from './components/Sidebar'
import { MainContainer } from './components/MainContainer'

import './styles/styles.css'
import './styles/modules/base.css'
import './styles/modules/utilities.css'
import './styles/modules/navigation.css'
import './styles/modules/upload.css'
import './styles/modules/modals.css'
import './styles/modules/notifications.css'
import './styles/modules/pdfviewer.css'
import './styles/modules/extraction.css'
import './styles/modules/carousel.css'
import './styles/modules/summary.css'
import './styles/modules/chat.css'
import './styles/modules/compare.css'
import './styles/modules/sidebar.css'
import './styles/modules/app-layout.css'  
import './styles/modules/app-wrapper.css'  


function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Notifications />

      <div className="app-layout">
        <div className="app-wrapper">
          <Sidebar isOpen={true} />
          <MainContainer />
        </div>
      </div>

    </BrowserRouter>
  )
}

export default App
