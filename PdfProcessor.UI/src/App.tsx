import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { configService } from './config';
import { Loader2 } from 'lucide-react';

function App() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    const initConfig = async () => {
      await configService.init();
      setIsConfigLoaded(true);
    };
    initConfig();
  }, []);

  if (!isConfigLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
