import React from 'react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, isLoading } = useAuth();

  // If authentication is loading, show a subtle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-subtle">Loading...</div>
      </div>
    );
  }

  // If user is logged in, show the dashboard
  if (user) {
    return <Dashboard />;
  }

  // Otherwise, show the login form
  return <LoginForm />;
};

export default Index;
