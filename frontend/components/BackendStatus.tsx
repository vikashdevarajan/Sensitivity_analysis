import { useEffect, useState } from 'react';
import { Circle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:8000';

export const BackendStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        });
        setIsConnected(response.ok);
        setLastCheck(new Date());
      } catch (error) {
        console.error('Backend health check failed:', error);
        setIsConnected(false);
        setLastCheck(new Date());
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-3 h-3"
      title={`Backend ${isConnected ? 'connected' : 'disconnected'} ${lastCheck ? `at ${lastCheck.toLocaleTimeString()}` : ''}`}
    >
      <Circle 
        className={`w-3 h-3 ${isConnected ? 'fill-emerald-500 text-emerald-500' : 'fill-red-500 text-red-500'} transition-colors`}
      />
    </div>
  );
};