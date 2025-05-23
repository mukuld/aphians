import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
// import Navbar from './Navbar';

const ProfilePage = ({ currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://www.dharwadkar.com';

  // Helper to format ISO date strings to MM/DD/YYYY
  const formatDateForDisplay = (isoDateString) => {
    if (!isoDateString) return 'N/A';
    try {
      const date = new Date(isoDateString);
      if (isNaN(date)) {
          return 'Invalid Date';
      }
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", isoDateString, e);
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile for userId:', userId);
        const response = await fetch(`/aphians/api/profile/${userId}`, {
          credentials: 'include',
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
  }, [userId]); // Only re-fetch if userId changes

  const getImageUrl = (photo) => {
    if (!photo || photo === '[object Object]' || typeof photo !== 'string') {
      console.warn('Invalid latest_photo value:', photo);
      return 'https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image'; // Updated placeholder
    }
    if (photo.startsWith('/aphians/')) {
      return `${BASE_URL}${photo}`;
    }
    if (photo.startsWith('/Uploads/')) { // Ensure this matches your backend upload path prefix
      return `${BASE_URL}/aphians${photo.replace('/Uploads/', '/Uploads/')}`; // Corrected potential case issue if /Uploads/ vs /uploads/
    }
    return photo;
  };

  const handleBackToCommunity = () => {
    navigate('/aphians/community');
  };

  const handleEditMyProfile = () => {
    // This button only appears if it's the current user's profile being viewed
    // and navigates to the dedicated ProfileForm for editing.
    if (currentUser && parseInt(userId, 10) === currentUser.id) {
      navigate('/aphians/edit-profile');
    } else {
      // This case should ideally not happen as the button is conditionally rendered,
      // but as a fallback for robustness.
      console.warn('Attempted to edit profile for a non-current user or without currentUser data.');
    }
  };

  const handleImageClick = () => {
    setIsLightboxOpen(true);
  }


  if (error) {
    return (
      <div className="bg-white flex flex-col">
        {/* <Navbar /> */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-red-600 text-center p-4">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* <Navbar /> */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-4">Loading...</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && parseInt(userId, 10) === currentUser.id;

  return (
    <div className="bg-gray-100 items-center flex flex-col">
      {/* <Navbar /> */}
      <div className="p-4">
        <div className="max-w-5xl w-full bg-white rounded-lg shadow-xl p-8 my-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-extrabold text-gray-900">Profile</h2>
            <button
              onClick={handleBackToCommunity}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              Back to Community
            </button>
          </div>
          {/* Always render ProfileView as this component is now only for viewing */}
          <ProfileView
            profile={profile}
            getImageUrl={getImageUrl}
            isOwnProfile={isOwnProfile} // Pass this to conditionally show "Edit My Profile" button
            handleEditMyProfile={handleEditMyProfile} // Pass the handler
            formatDateForDisplay={formatDateForDisplay}
            handleImageClick={handleImageClick}
          />
          {isLightboxOpen && profile.latest_photo && (
            <Lightbox
            open={isLightboxOpen}
            close={() => setIsLightboxOpen(false)}
            slides={[{ src: getImageUrl(profile.latest_photo)}]}
            carousel={{
            finite: true, // Prevents wrapping around, making it clear there's only one slide
            preload: 0,   // Crucial: Only preload the current slide (0 means 2*0+1 = 1 slide)
            spacing: "0px", // Optional: Remove spacing between non-existent other slides
            padding: "0px", // Optional: Remove padding
          }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ProfileView is an internal helper component for ProfilePage
const ProfileView = ({ profile, getImageUrl, isOwnProfile, handleEditMyProfile, formatDateForDisplay, handleImageClick }) => {
    // Grouping data for better rendering
    const personalInfo = [
        { label: "Full Name", value: profile.full_name },
        { label: "Street Address", value: profile.street_address },
        { label: "City", value: profile.city },
        { label: "State", value: profile.state },
        { label: "Zip", value: profile.zip },
        { label: "Country", value: profile.country },
        { label: "Birthday", value: formatDateForDisplay(profile.birthday) },
        { label: "Marriage Anniversary", value: formatDateForDisplay(profile.marriage_anniversary) }
    ];

    const contactInfo = [
        { label: "Email", value: profile.email_id },
        { label: "Phone", value: profile.phone_country_code ? `${profile.phone_country_code} ${profile.phone_number}` : profile.phone_number }
    ];

    const professionalInfo = [
        { label: "Occupation", value: profile.current_occupation },
        { label: "Company", value: profile.company_name },
        { label: "Job Role", value: profile.job_role }
    ];

    const socialMediaInfo = [
        { label: "Social Media 1", value: profile.social_media_1, isLink: true },
        { label: "Social Media 2", value: profile.social_media_2, isLink: true },
        { label: "Social Media 3", value: profile.social_media_3, isLink: true }
    ];

    const familyInfo = [
        { label: "Spouse", value: profile.spouse_name },
        { label: "Child 1", value: profile.child_1_name ? `${profile.child_1_name} (Age: ${profile.child_1_age || 'N/A'})` : null },
        { label: "Child 2", value: profile.child_2_name ? `${profile.child_2_name} (Age: ${profile.child_2_age || 'N/A'})` : null },
        { label: "Child 3", value: profile.child_3_name ? `${profile.child_3_name} (Age: ${profile.child_3_age || 'N/A'})` : null }
    ];

    const additionalInfo = [
        { label: "Special Message", value: profile.special_message }
    ];

    const renderInfoSection = (title, data) => (
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">{title}</h4>
            <div className="space-y-2 text-gray-700">
                {data.map((item, index) => (
                    item.value && (
                        <p key={index}>
                            <strong className="font-medium">{item.label}:</strong>{' '}
                            {item.isLink ? (
                                <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-words">
                                    {item.value}
                                </a>
                            ) : (
                                item.value || 'N/A'
                            )}
                        </p>
                    )
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex-grow flex flex-col items-center md:flex-row md:items-start md:space-x-8 mb-8">
                <div className="w-48 h-48 flex-shrink-0 mb-6 md:mb-0">
                    <img
                        src={getImageUrl(profile.latest_photo)}
                        alt={profile.full_name || 'Unknown'}
                        className="w-full h-full object-cover rounded-full border-4 border-blue-400 shadow-md cursor-pointer"
                        onError={(e) => {
                            console.error('Failed to load image:', profile.latest_photo);
                            e.target.src = 'https://via.placeholder.com/200/CCCCCC/FFFFFF?text=No+Image';
                        }}
                        onClick={handleImageClick}
                    />
                </div>
                <div className="text-center md:text-left flex-grow">
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{profile.full_name || 'Unknown'}</h3>
                    <p className="text-lg text-gray-600">{profile.city || 'Unknown City'}</p>
                    <p className="text-md text-gray-500 mt-2">
                        {profile.current_occupation && profile.company_name
                            ? `${profile.job_role ? profile.job_role + ' at ' : ''}${profile.company_name} (${profile.current_occupation})`
                            : profile.current_occupation || profile.job_role || 'No Occupation Info'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderInfoSection("Personal Information", personalInfo)}
                {renderInfoSection("Contact Information", contactInfo)}
                {renderInfoSection("Professional Information", professionalInfo)}
                {renderInfoSection("Social Media", socialMediaInfo)}
                {renderInfoSection("Family Information", familyInfo)}
                {renderInfoSection("Additional Information", additionalInfo)}
            </div>

            {isOwnProfile && (
                <div className="mt-10 text-center">
                    <button
                        onClick={handleEditMyProfile} // Correctly call the handler for editing
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                    >
                        Edit My Profile
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;