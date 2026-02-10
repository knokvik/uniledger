import React from 'react'

const TestPage = () => {
  const [serverStatus, setServerStatus] = React.useState<string>('checking...')

  React.useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:3000/health')
        const data = await response.json()
        setServerStatus(`✅ Backend running: ${data.message}`)
      } catch (error) {
        setServerStatus(`❌ Backend not running: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    checkServer()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Debug Info</h1>
        
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <p className="text-sm font-mono">{serverStatus}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2"><strong>Check:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Backend running on port 3000?</li>
            <li>Frontend on port 5173?</li>
            <li>Database table created in Supabase?</li>
            <li>Check browser console for errors (F12)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TestPage
