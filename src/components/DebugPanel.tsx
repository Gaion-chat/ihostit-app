import { useState } from 'react';
import { githubService } from '@/services/github';

export function DebugPanel() {
  const [status, setStatus] = useState('Ready');
  const [result, setResult] = useState<any>(null);

  const testFetch = async () => {
    try {
      setStatus('Fetching...');
      console.log('🧪 Debug: Starting manual fetch test');
      
      const data = await githubService.fetchAwesomeSelfHosted();
      
      console.log('🧪 Debug: Fetch completed', data);
      setResult({
        categoriesCount: data.length,
        totalApps: data.reduce((sum, cat) => sum + cat.apps.length, 0),
        firstCategory: data[0]?.name || 'None',
        firstApp: data[0]?.apps[0]?.name || 'None'
      });
      setStatus('Success!');
    } catch (error) {
      console.error('🧪 Debug: Fetch failed', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      setStatus('Failed!');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <p className="text-sm mb-2">Status: {status}</p>
      <button 
        onClick={testFetch}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm mb-2"
      >
        Test Fetch
      </button>
      {result && (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
