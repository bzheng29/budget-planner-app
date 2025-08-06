import { useState, useEffect } from 'react'
import './App.css'
import ProgressiveBudgetFlow from './components/ProgressiveBudgetFlow'
import { MemoryDebugger } from './components/MemoryDebugger'
import type { UserMemoryProfile } from './types/memory'

function App() {
  const [showDebug, setShowDebug] = useState(false)
  const [memoryProfile, setMemoryProfile] = useState<UserMemoryProfile | undefined>()

  // Add keyboard shortcut for debug view (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setShowDebug(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="app">
      {/* Debug Toggle Button */}
      <button 
        className="debug-toggle"
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: showDebug ? '#f87171' : '#4ade80',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        title={showDebug ? 'Hide Debug View' : 'Show Debug View'}
      >
        {showDebug ? '🔒' : '🔍'}
      </button>

      {/* Debug View */}
      {showDebug && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 999,
          overflow: 'auto',
          padding: '20px'
        }}>
          <button
            onClick={() => setShowDebug(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#f87171',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 1001
            }}
          >
            Close Debug View
          </button>
          <MemoryDebugger 
            memory={memoryProfile}
            onGenerateTestData={() => {
              console.log('Generating test data...')
            }}
          />
        </div>
      )}

      {/* Main App */}
      <ProgressiveBudgetFlow 
        onMemoryUpdate={(memory: UserMemoryProfile) => {
          setMemoryProfile(memory)
        }}
      />
    </div>
  )
}

export default App
