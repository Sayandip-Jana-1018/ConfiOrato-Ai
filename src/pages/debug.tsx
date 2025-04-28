import { useState } from 'react';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://confiorato-ai.onrender.com');
  const [endpoint, setEndpoint] = useState('/api/health');

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debug-backend?url=${encodeURIComponent(backendUrl)}&endpoint=${encodeURIComponent(endpoint)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Debugging</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Backend URL:</label>
        <input 
          type="text" 
          value={backendUrl} 
          onChange={(e) => setBackendUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Endpoint:</label>
        <input 
          type="text" 
          value={endpoint} 
          onChange={(e) => setEndpoint(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Common Endpoints to Test</h2>
        <ul className="list-disc pl-5">
          <li><code>/api/health</code> - Health check endpoint</li>
          <li><code>/api/body-language/start-session</code> - Start session endpoint (POST)</li>
        </ul>
        <p className="mt-2 text-sm text-gray-700">
          Note: POST endpoints may not work with this tool as it uses GET requests.
        </p>
      </div>
    </div>
  );
}
