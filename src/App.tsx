import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/AuthForm';
import SaveAsWebappModal from './components/SaveAsWebappModal';
import Navigation from './components/Navigation';
import Community from './pages/Community';
import Classroom from './pages/Classroom';
import Blueprints from './pages/Blueprints';
import AITool from './pages/AITool';
import Users from './pages/Users';
import Webhooks from './pages/Webhooks';
import Settings from './pages/Settings';

type User = {
  id: string;
  email?: string;
} | null;

function App() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [showWebappModal, setShowWebappModal] = useState(false);

  const checkIfMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const handleAuthStateChange = useCallback((_event: string, session: any) => {
    const newUser = session?.user ?? null;
    setUser(newUser);
    
    if (newUser && checkIfMobile()) {
      // Check if we've shown the modal before
      const hasShownModal = localStorage.getItem('hasShownWebappModal');
      if (!hasShownModal) {
        setShowWebappModal(true);
      }
    }
  }, []);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('SIGNED_IN', session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  const handleCloseWebappModal = () => {
    setShowWebappModal(false);
    localStorage.setItem('hasShownWebappModal', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {!user ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <AuthForm />
        </div>
      ) : (
        <BrowserRouter>
          <div className="flex">
            <Navigation />
            <main className="flex-1 lg:ml-64 text-white">
              <Routes>
                <Route path="/community" element={<Community />} />
                <Route path="/classroom/*" element={<Classroom />} />
                <Route path="/blueprints" element={<Blueprints />} />
                <Route path="/ai-tool" element={<AITool />} />
                {user?.email === 'markofilipovic2003@gmail.com' && (
                  <>
                    <Route path="/users" element={<Users />} />
                    <Route path="/webhooks" element={<Webhooks />} />
                  </>
                )}
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/community" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      )}
      {showWebappModal && <SaveAsWebappModal onClose={handleCloseWebappModal} />}
    </div>
  );
}

export default App;
