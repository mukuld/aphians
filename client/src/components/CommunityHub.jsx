import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming Navbar is imported here

const CommunityHub = ({ currentUser }) => {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://www.dharwadkar.com';

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch('/aphians/api/profile/all', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
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
    navigate(`/aphians/profile/${userId}`); // Navigate to ProfilePage (view mode)
  };

  const handleEditProfile = () => {
    // Navigate to the dedicated ProfileForm component for editing
    if (currentUser && currentUser.id) {
      navigate(`/aphians/edit-profile`);
    } else {
      setError('User not logged in or profile ID not available for editing.');
    }
  };

  const getThumbnailUrl = (photo) => {
    if (!photo || photo === '[object Object]' || typeof photo !== 'string') {
      return 'https://via.placeholder.com/100/CCCCCC/FFFFFF?text=User'; // Larger, default placeholder
    }
    if (photo.startsWith('/aphians/')) {
      return `${BASE_URL}${photo}`;
    }
    if (photo.startsWith('/Uploads/')) { // Ensure this matches your backend upload path prefix
      return `${BASE_URL}/aphians${photo.replace('/Uploads/', '/Uploads/')}`; // Corrected potential case issue
    }
    return photo;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 flex-grow">
        <h2 className="text-4xl font-bold mb-8 text-center text-gray-900">Community Hub</h2>
        {error && <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded mb-4 text-center">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {profiles.map((profile) => (
            <div
              key={profile.user_id}
              className="bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 relative p-6 pt-20 text-left flex flex-col justify-between min-h-[250px] w-[400px] mx-auto"
            >
              <div className="absolute top-4 left-4 w-24 h-24">
                <img
                  src={getThumbnailUrl(profile.latest_photo)}
                  alt={profile.full_name || 'Unknown'}
                  className="w-full h-full object-cover rounded-full border-4 border-white shadow-md"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100/CCCCCC/FFFFFF?text=User';
                  }}
                />
              </div>
              <div className="ml-28 mt-2 flex-grow flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{profile.full_name || 'Unknown'}</h3>
                <p className="text-gray-600 text-sm">{profile.city || 'Unknown City'}</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-start gap-2 pl-4">
                <button
                  onClick={() => handleViewProfile(profile.user_id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200 text-sm"
                >
                  View Profile
                </button>
                {/* The condition for showing the Edit button */}
                {currentUser && currentUser.id === profile.user_id && (
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 text-sm"
                  >
                    Edit My Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;