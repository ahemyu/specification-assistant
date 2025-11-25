import { Notifications } from './components/Notifications'
import Sidebar from './components/Sidebar'
import { MainContainer } from './components/MainContainer'
import { Home } from './components/Home'
import { CompareView } from './components/PDF-Vergleich/CompareView'
import { useAppStore } from './store/useAppStore'
import { QAPopup } from './components/QAPopup'

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
import './styles/modules/qapopup.css'


function App() {
  const activeView = useAppStore((state) => state.activeView);

  return (
    <>
      <Notifications />
      <QAPopup />

      <div className="app-layout">
        <div className="app-wrapper">
          <Sidebar isOpen={true} />
          <div className="main-content">
            <main className="scroll-area">
              {activeView === 'home' && <Home />}
              {activeView === 'spec_assistant' && <MainContainer />}
              {activeView === 'compare' && <CompareView />}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}


export default App

