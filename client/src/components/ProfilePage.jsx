import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ProfileForm from './ProfileForm';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching profile from /aphians/api/profile');
    fetch('/aphians/api/profile', {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    })
      .then(res => {
        console.log('Fetch response:', res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
          return res.json();
        })
      .then(data => {
        console.log('Profile data:', data);
        setProfile(data);
        setLoading(false);
      })
      .catch (err => {
        console.error("Fetching profile error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSave = (formData) => {
    fetch('/aphians/api/profile', {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setProfile(formData);
        alert('Profile saved successfully!');
      })
      .catch(err => {
        console.error('Save profile error:', err);
        alert(`Failed to save profile: ${err.message}`);
      });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Profile</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <ProfileForm profile={profile} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;