import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProfileView = ({ currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://www.dharwadkar.com';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile for userId:', userId);
        const response = await fetch(`/aphians/api/profile/${userId}`, {
          credentials: 'include'
        });
        console.log('Profile fetch response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Profile data:', data);
          setProfile(data);
        } else {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      }
    };
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const getImageUrl = (photo) => {
    if (!photo || photo === '[object Object]' || typeof photo !== 'string') {
      console.warn('Invalid latest_photo value:', photo);
      return 'https://via.placeholder.com/150';
    }
    if (photo.startsWith('/aphians/')) {
      return `${BASE_URL}${photo}`;
    }
    if (photo.startsWith('/Uploads/')) {
      return `${BASE_URL}/aphians${photo.replace('/Uploads/', '/uploads/')}`;
    }
    return photo;
  };

  const handleEditProfile = () => {
    console.log('Navigating to edit profile');
    navigate('/aphians/profile');
  };

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center p-4">Loading...</div>;
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(userId, 10);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Profile</h2>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0">
            <img
              src={getImageUrl(profile.latest_photo)}
              alt={profile.full_name || 'Unknown'}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                console.error('Failed to load image:', profile.latest_photo);
                e.target.src = 'https://via.placeholder.com/150';
              }}
            />
          </div>
          <div className="md:w-2/3 md:pl-6">
            <h3 className="text-2xl font-semibold">{profile.full_name || 'Unknown'}</h3>
            <p className="text-gray-600 mb-2">{profile.city || 'Unknown City'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p><strong>Street Address:</strong> {profile.street_address || 'N/A'}</p>
                <p><strong>State:</strong> {profile.state || 'N/A'}</p>
                <p><strong>Zip:</strong> {profile.zip || 'N/A'}</p>
                <p><strong>Country:</strong> {profile.country || 'N/A'}</p>
                <p><strong>Phone:</strong> {profile.phone_number || 'N/A'}</p>
                <p><strong>Email:</strong> {profile.email_id || 'N/A'}</p>
                <p><strong>Birthday:</strong> {profile.birthday || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Occupation:</strong> {profile.current_occupation || 'N/A'}</p>
                <p><strong>Company:</strong> {profile.company_name || 'N/A'}</p>
                <p><strong>Job Role:</strong> {profile.job_role || 'N/A'}</p>
                <p><strong>Social Media 1:</strong> {profile.social_media_1 || 'N/A'}</p>
                <p><strong>Social Media 2:</strong> {profile.social_media_2 || 'N/A'}</p>
                <p><strong>Social Media 3:</strong> {profile.social_media_3 || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4">
              <p><strong>Spouse:</strong> {profile.spouse_name || 'N/A'}</p>
              <p><strong>Child 1:</strong> {profile.child_1_name ? `${profile.child_1_name} (Age: ${profile.child_1_age || 'N/A'})` : 'N/A'}</p>
              <p><strong>Child 2:</strong> {profile.child_2_name ? `${profile.child_2_name} (Age: ${profile.child_2_age || 'N/A'})` : 'N/A'}</p>
              <p><strong>Child 3:</strong> {profile.child_3_name ? `${profile.child_3_name} (Age: ${profile.child_3_age || 'N/A'})` : 'N/A'}</p>
              <p><strong>Special Message:</strong> {profile.special_message || 'N/A'}</p>
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <div className="mt-6 text-center">
            <button
              onClick={handleEditProfile}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;