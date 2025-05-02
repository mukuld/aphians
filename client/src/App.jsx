import React from 'react';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/ProfilePage';

const App = () => {
  const path = window.location.pathname;
  console.log('Current path:', path);
  if (path === '/' || path === '') {
    return <LandingPage />;
  }
  if (path === '/profile') {
    return <ProfilePage />;
  }
  return <div>404 - Page Cannot be Not Found</div>;
};

export default App;