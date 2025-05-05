import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/ProfilePage';

const App = () => {
  return (
    <BrowserRouter basename="/aphians">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<div>404 - Page Cannot be found anywhere</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;