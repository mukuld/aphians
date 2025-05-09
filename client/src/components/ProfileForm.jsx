import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileForm = ({ currentUser, onSave }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!currentUser || !currentUser.id) {
        // If currentuser or its ID is not available, stop loading and indicate error
        setLoading(false);
        setError("User not logged in or user ID missing.");
        console.log("ProfileForm: No current user ID available to fetch profile.");
        return;
      }

      try {
        console.log("ProfileForm: Fetching profile for form population from /aphians/api/profile");
        //This fetches the logged in user's profile using GET /api/profile endpoint
        const response = await fetch("/aphians/api/profile", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json"}  //Include headers for GET
        });

        if (response.ok) {
          const data = await response.json();
          console.log("ProfileFrom: Profile data fetech for form:", data);
          setFormData(data); //Populate formData with the fetched data
        } else {
          if (response.status === 404) {
            // If profile not found in case the user is logging in for the first time
            console.log("ProfileForm: Existing profile not found. Starting with an empty form");
            setFormData({}); //Keep form empty for new profile creation
          } else {
            const errorText = await response.text();
            throw new Error(`Failed to fetch profile for form: ${response.status} ${response.statusText} - ${errorText}`);
          }
        }
      } catch (err) {
        console.error("ProfileForm: Error fetching profile for form:", err);
        setError(err.message);
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    fetchMyProfile();
    //Dependency array: Re-run this effect if currentUser changes (e.g after a new login)
  }, [currentUser]);

  // Helper: Format date to yyyy-MM-dd
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Returns yyyy-MM-dd
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const formDataToSend = new FormData();
  //   Object.keys(formData).forEach((key) => {
  //     const value = key === 'birthday' ? formatDate(formData[key]) : formData[key];
  //     formDataToSend.append(key, value);
  //   });
  //   try {
  //     console.log('Sending POST to /aphians/api/profile with FormData');
  //     const response = await fetch('/aphians/api/profile', {
  //       method: 'POST',
  //       body: formDataToSend,
  //       credentials: 'include'
  //     });
  //     if (response.ok) {
  //       const result = await response.json();
  //       console.log('Profile saved:', result);
  //       setError(null);
  //       onSave(formData);
  //       navigate('/aphians/community'); // Redirect to CommunityHub
  //     } else {
  //       const errorText = await response.text();
  //       throw new Error(`Failed to save profile: ${response.status} ${response.statusText} - ${errorText}`);
  //     }
  //   } catch (error) {
  //     console.error('Error saving profile:', error);
  //     setError(error.message);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Append all form data fields
    Object.keys(formData).forEach((key) => {
      // Exclude properties that should not be sent directly or are handled by Multer
      // E.g., user_id is derived from req.user.id on the backend.
      if (key === 'user_id' || key === 'created_at' || key === 'updated_at') {
        return;
      }

      const value = formData[key];
      if (key === 'birthday') {
        // Format birthday for submission
        formDataToSend.append(key, formatDate(value));
      } else if (key === 'latest_photo' && value instanceof File) {
        // Append the file directly if it's a File object
        formDataToSend.append(key, value);
      } else if (key === 'latest_photo' && typeof value === 'string' && value.startsWith('/aphians/uploads/')) {
        // If latest_photo is a string (existing URL), don't re-upload unless a new file is selected
        // You might need a hidden input or specific logic if you want to explicitly clear it.
        // For now, if it's a URL, we skip appending it unless a new file was chosen.
      }
       else if (value !== null && value !== undefined) { // Append other non-null/undefined values
        formDataToSend.append(key, value);
      }
    });


    try {
      console.log('ProfileForm: Sending POST to /aphians/api/profile with FormData');
      const response = await fetch('/aphians/api/profile', {
        method: 'POST',
        body: formDataToSend, // FormData does not require 'Content-Type' header
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('ProfileForm: Profile saved:', result);
        setError(null);
        // onSave prop might be used by a parent component for specific actions,
        // but for a direct form like this, navigation might be sufficient.
        // onSave(formData); // You might still call this if a parent needs updated formData

        navigate('/aphians/community'); // Redirect to CommunityHub after successful save
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to save profile: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('ProfileForm: Error saving profile:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  if (error) {
    return <div>Error loading profile: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="full_name" value={formData.full_name || ''} onChange={handleChange} 
            placeholder="Full Name" className="p-2 border rounded" required />
          <input name="street_address" value={formData.street_address || ''} onChange={handleChange} 
            placeholder="Street Address" className="p-2 border rounded" />
          <input name="city" value={formData.city || ''} onChange={handleChange} 
            placeholder="City" className="p-2 border rounded" />
          <input name="state" value={formData.state || ''} onChange={handleChange} 
            placeholder="State" className="p-2 border rounded" />
          <input name="zip" value={formData.zip || ''} onChange={handleChange} 
            placeholder="PIN / Zip" className="p-2 border rounded" />
          <input name="country" value={formData.country || ''} onChange={handleChange} 
            placeholder="Country" className="p-2 border rounded" />
          <input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} 
            placeholder="Phone Number" className="p-2 border rounded" />
          <input name="email_id" value={formData.email_id || ''} onChange={handleChange} 
            placeholder="Email ID" className="p-2 border rounded" />
          <input name="birthday" type="date" value={formatDate(formData.birthday)} onChange={handleChange} 
            className="p-2 border rounded" />
          <input name="current_occupation" value={formData.current_occupation || ''} onChange={handleChange} 
            placeholder="Current Occupation" className="p-2 border rounded" />
          <input name="company_name" value={formData.company_name || ''} onChange={handleChange} 
            placeholder="Company Name" className="p-2 border rounded" />
          <input name="job_role" value={formData.job_role || ''} onChange={handleChange} 
            placeholder="Job Role" className="p-2 border rounded" />
          <input name="social_media_1" value={formData.social_media_1 || ''} onChange={handleChange} 
            placeholder="Social Media Link 1" className="p-2 border rounded" />
          <input name="social_media_2" value={formData.social_media_2 || ''} onChange={handleChange} 
            placeholder="Social Media Link 2" className="p-2 border rounded" />
          <input name="social_media_3" value={formData.social_media_3 || ''} onChange={handleChange} 
            placeholder="Social Media Link 3" className="p-2 border rounded" />
          <input name="spouse_name" value={formData.spouse_name || ''} onChange={handleChange} 
            placeholder="Spouse Name" className="p-2 border rounded" />
          <input name="child_1_name" value={formData.child_1_name || ''} onChange={handleChange} 
            placeholder="Child 1 Name" className="p-2 border rounded" />
          <input name="child_2_name" value={formData.child_2_name || ''} onChange={handleChange} 
            placeholder="Child 2 Name" className="p-2 border rounded" />
          <input name="child_3_name" value={formData.child_3_name || ''} onChange={handleChange} 
            placeholder="Child 3 Name" className="p-2 border rounded" />
          <input name="child_1_age" type="number" value={formData.child_1_age || ''} onChange={handleChange} 
            placeholder="Child 1 Age" className="p-2 border rounded" />
          <input name="child_2_age" type="number" value={formData.child_2_age || ''} onChange={handleChange} 
            placeholder="Child 2 Age" className="p-2 border rounded" />
          <input name="child_3_age" type="number" value={formData.child_3_age || ''} onChange={handleChange} 
            placeholder="Child 3 Age" className="p-2 border rounded" />
          <textarea name="special_message" value={formData.special_message || ''} onChange={handleChange} 
            placeholder="Special Message for Friends" className="p-2 border rounded col-span-2" />
          <input name="latest_photo" type="file" onChange={handleChange} className="p-2 border rounded" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;