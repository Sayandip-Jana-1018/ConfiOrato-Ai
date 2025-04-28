import { useState, useEffect } from 'react';

export default function TestConnection() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<any>(null);
  const [directLoading, setDirectLoading] = useState(false);

  // Test connection through Next.js API route
  const testServerConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-backend-connection');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Test direct connection from browser to backend
  const testDirectConnection = async () => {
    setDirectLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://confiorato-ai.onrender.com';
      console.log(`Attempting direct connection to: ${backendUrl}/api/health`);
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setDirectTestResult({ 
          error: 'Backend connection failed', 
          status: response.status,
          statusText: response.statusText,
          errorText,
          backendUrl,
        });
        return;
      }
      
      const data = await response.json();
      setDirectTestResult({
        success: true,
        message: 'Successfully connected directly to backend',
        backendResponse: data,
        backendUrl,
      });
    } catch (error) {
      setDirectTestResult({ 
        error: 'Failed to connect directly to backend', 
        message: error instanceof Error ? error.message : String(error),
        backendUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL,
      });
    } finally {
      setDirectLoading(false);
    }
  };

  // Display environment variables for debugging
  const [envVars, setEnvVars] = useState<any>({});
  
  useEffect(() => {
    setEnvVars({
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'Not set',
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Test via Next.js API</h2>
          <button 
            onClick={testServerConnection}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Server Connection'}
          </button>
          
          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Test Direct Browser Connection</h2>
          <button 
            onClick={testDirectConnection}
            disabled={directLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {directLoading ? 'Testing...' : 'Test Direct Connection'}
          </button>
          
          {directTestResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
                {JSON.stringify(directTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>If both tests fail, your backend may be unreachable or the URL is incorrect</li>
          <li>If the server test works but direct test fails, you likely have a CORS issue</li>
          <li>Check that your backend CORS settings include your Vercel domain</li>
          <li>Verify that your backend is properly deployed and running</li>
          <li>Check for any network errors in the browser console</li>
        </ul>
      </div>
    </div>
  );
}
