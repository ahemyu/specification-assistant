import { Notifications } from './components/Notifications'
import Sidebar from './components/Sidebar'
import { MainContainer } from './components/MainContainer'
import { Home } from './components/Home'
import { CompareView } from './components/DocCompare/CompareView'
import { useAppStore } from './store/useAppStore'
import { QAPopup } from './components/QAPopup'

import './styles/styles.css'


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
              {activeView === 'spec_ai' && <MainContainer />}
              {activeView === 'compare' && <CompareView />}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}


export default App

