import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ProfileForm from './ProfileForm';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  const handleSave = (formData) => {
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setProfile(formData);
        alert('Profile saved successfully!');
      });
  };

  if (loading) return <div>Loading...</div>;

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