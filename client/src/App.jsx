import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ProfileForm from './components/ProfileForm';
import CommunityHub from './components/CommunityHub';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/aphians/api/profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const profile = await response.json();
          setCurrentUser({ id: profile.user_id });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/aphians" element={<LandingPage />} />
        <Route
          path="/aphians/profile"
          element={<ProfileForm profile={{}} onSave={(data) => setCurrentUser({ id: data.user_id })} />}
        />
        <Route
          path="/aphians/profile/:userId"
          element={<ProfileForm profile={{}} onSave={() => {}} />}
        />
        <Route
          path="/aphians/community"
          element={<CommunityHub currentUser={currentUser} />}
        />
        <Route path="/aphians/login" element={<Navigate to="/auth/google" />} />
        <Route path="*" element={<Navigate to="/aphians" />} />
      </Routes>
    </Router>
  );
};

export default App;