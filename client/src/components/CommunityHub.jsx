import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CommunityHub = ({ currentUser }) => {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        console.log('Fetching profiles from /aphians/api/profile/all');
        const response = await fetch('/aphians/api/profile/all', {
          credentials: 'include'
        });
        console.log('Response status:', response.status, 'Headers:', response.headers);
        if (response.ok) {
          const data = await response.json();
          console.log('Profiles fetched:', data);
          setProfiles(data);
        } else {
          throw new Error(`Failed to fetch profiles: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err.message);
      }
    };
    fetchProfiles();
  }, []);

  const handleViewProfile = (userId) => {
    if (!userId || isNaN(userId) || userId <= 0) {
      console.error('Invalid userId for profile navigation:', userId);
      setError('Invalid profile ID');
      return;
    }
    console.log('Navigating to profile:', userId);
    navigate(`/aphians/profile/${userId}`);
  };

  const handleEditProfile = () => {
    console.log('Navigating to edit profile');
    navigate('/aphians/profile');
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Community Hub</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.user_id}
            className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={profile.latest_photo || 'https://via.placeholder.com/150'}
              alt={profile.full_name || 'Unknown'}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{profile.full_name || 'Unknown'}</h3>
              <p className="text-gray-600">{profile.city || 'Unknown City'}</p>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => handleViewProfile(profile.user_id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  View Profile
                </button>
                {currentUser && currentUser.id === profile.user_id && (
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityHub;