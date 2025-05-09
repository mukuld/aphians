import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ProfileForm from './components/ProfileForm';
import ProfilePage from "./components/ProfilePage";
import CommunityHub from './components/CommunityHub';


const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/aphians/api/auth/current', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated) {
            setCurrentUser(data.user);
            console.log('App.jsx: Current user fetched:', data.user); // Log to verify
          } else {
            setCurrentUser(nul);
            console.log("App.jsx: No active session found or user not authenticated.");
          }
        } else {
          console.log("App.jsx: Failed to fetch current user or no active session found (response not ok):", response.status);
          setCurrentUser(null); // Ensure currentUser is null if fetch fails or isn't authenticated
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setCurrentUser(null); // Ensure currentUser is null on network/parsing error
      }
    };
    fetchCurrentUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/aphians" element={<LandingPage />} />
        <Route path="/aphians/community" element={<CommunityHub currentUser={currentUser} />} />
        <Route path="/aphians/profile" element={<ProfileForm currentUser={currentUser} />} />
        <Route path="/aphians/profile/:userId" element={<ProfilePage currentUser={currentUser} />} />
        <Route path="*" element={<Navigate to="/aphians" />} />
      </Routes>
    </Router>
  );
};

export default App;