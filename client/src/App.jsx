import React from 'react';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/ProfilePage';

const App = () => {
  const path = window.location.pathname;
  return path === '/' ? <LandingPage /> : <ProfilePage />;
};

export default App;