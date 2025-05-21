import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import countries from '../data/countries.json'; // Ensure this path is correct
import useIsMobile from '../utils/useIsMobile';

const ProfileForm = ({ currentUser, onSave }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false)   // Setting default state for success notification to false.
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // const [isMobile, setIsMobile] = useState(false);
  // useEffect(() => {
  //   const checkMobile = () => {
  //     const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  //     setIsMobile(/iphone|ipad|ipod|android|blackberry|windows phone|mobile/i.test(userAgent));
  //   };
  //   checkMobile();
  //   window.addEventListener('resize', checkMobile);
  //   return () => window.removeEventListener('resize', checkMobile);
  // }, []);

  // Refs for hidden date inputs
  const birthdayRef = useRef(null);
  const marriageAnniversaryRef = useRef(null);

  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!currentUser || !currentUser.id) {
        setLoading(false);
        setError("User not logged in or user ID missing.");
        console.log("ProfileForm: No current user ID available to fetch profile.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // console.log("ProfileForm: Fetching profile for form population from /aphians/api/profile");
        const response = await fetch("/aphians/api/profile", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("ProfileFrom: Profile data fetched for form:", data);
          setFormData({
            full_name: data.full_name || '',
            street_address: data.street_address || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            country: data.country || '',
            phone_country_code: data.phone_country_code || '',
            phone_number: data.phone_number || '',
            email_id: data.email_id || '',
            birthday: data.birthday ? formatDate(data.birthday) : '',
            marriage_anniversary: data.marriage_anniversary ? formatDate(data.marriage_anniversary) : '',
            current_occupation: data.current_occupation || '',
            company_name: data.company_name || '',
            job_role: data.job_role || '',
            social_media_1: data.social_media_1 || '',
            social_media_2: data.social_media_2 || '',
            social_media_3: data.social_media_3 || '',
            spouse_name: data.spouse_name || '',
            child_1_name: data.child_1_name || '',
            child_2_name: data.child_2_name || '',
            child_3_name: data.child_3_name || '',
            child_1_age: data.child_1_age || '',
            child_2_age: data.child_2_age || '',
            child_3_age: data.child_3_age || '',
            special_message: data.special_message || '',
            latest_photo_url: data.latest_photo || null,
            latest_photo: null,
          });
        } else {
          if (response.status === 404) {
            // console.log("ProfileForm: Existing profile not found. Starting with an empty form");
            setFormData({
              full_name: '', street_address: '', city: '', state: '', zip: '',
              country: 'United States', phone_country_code: '', phone_number: '', email_id: '', birthday: '',
              marriage_anniversary: '', current_occupation: '', company_name: '', job_role: '',
              social_media_1: '', social_media_2: '', social_media_3: '', spouse_name: '',
              child_1_name: '', child_2_name: '', child_3_name: '', child_1_age: '',
              child_2_age: '', child_3_age: '', special_message: '', latest_photo: null,
              latest_photo_url: null
            });
          } else {
            const errorText = await response.text();
            const errorMessage = `Failed to fetch profile for form: ${response.status} ${response.statusText} - ${errorText}`;
            console.error("ProfileForm: Server error fetching profile:", errorMessage);
            setError(errorMessage);
          }
        }
      } catch (err) {
        console.error("ProfileForm: Network or unexpected error fetching profile:", err);
        setError(`Error fetching profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, [currentUser]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date) && dateStr === formatDate(date);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = files ? files[0] : value;

    if ((name === 'birthday' || name === 'marriage_anniversary') && isMobile && !isValidDate(value)) {
      setError(`${name} must be in YYYY-MM-DD format (e.g., 1990-05-20).`); // Corrected error message formatting
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));
    if (error) setError(null);
  };

  const handleDatePicker = (field, ref) => {
    if (ref.current) {
      ref.current.showPicker(); // Use showPicker() for modern browsers
      ref.current.onchange = (e) => {
        const value = formatDate(e.target.value);
        setFormData((prev) => ({ ...prev, [field]: value }));
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'user_id' || key === 'created_at' || key === 'updated_at' || key === 'latest_photo_url') return;
      if (key === 'birthday' || key === 'marriage_anniversary') {
        formDataToSend.append(key, formatDate(formData[key]));
      } else if (key === 'latest_photo' && formData[key] instanceof File) {
        formDataToSend.append(key, formData[key]);
      } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      // console.log('ProfileForm: Sending POST to /aphians/api/profile with FormData');
      const response = await fetch('/aphians/api/profile', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        // console.log('ProfileForm: Profile saved:', result);
        if (onSave) onSave(result);
        //Check if a new photo was uploaded and trigger success popup.
        if (formData.latest_photo instanceof File) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000); //Hide after 3 seconds
        }

        // Navigate to community hub after success allowing pop-up to show briefly. Adding a slight delay to ensure pop-up is visible
        setTimeout(() => navigate('/aphians/community'), formData.latest_photo instanceof File ? 2000 : 0); // Delay if photo was uploaded.
      } else {
        const errorText = await response.text();
        const errorMessage = `Failed to save profile: ${response.status} ${response.statusText} - ${errorText}`;
        console.error('ProfileForm: Server error saving profile:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('ProfileForm: Error saving profile:', error);
      setError(`Error saving profile: ${error.message}`);
    }
  };

  const handleCancel = () => {
    navigate('/aphians/community');
  };

  if (loading) {
    return (
      <div className="bg-white flex flex-col">
        {/* <Navbar /> */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-4">Loading profile data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 flex flex-col">
      {/* <Navbar /> */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-5xl w-full bg-white rounded-lg shadow-xl p-8 my-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {/* Pop-up / Toast notification for success */}
          {showSuccess && (
            <div className="fixed top-5 right-5 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-semibold">Success!</span>
              <span>Image uploaded successfully.</span>
            </div>
          )}

          <h2 className="text-4xl font-extrabold text-gray-900 mb-8">Your Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Personal Information */}
              <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="street_address"
                      name="street_address"
                      value={formData.street_address || ''}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your state"
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      value={formData.zip || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your zip code"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                    >
                      <option value="">Select a country</option>
                      {sortedCountries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
                      Birthday <span className="text-red-500">*</span>
                    </label>
                    {isMobile ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          id="birthday"
                          name="birthday"
                          value={formData.birthday || ''}
                          onChange={handleChange}
                          required
                          pattern="\d{4}-\d{2}-\d{2}"
                          placeholder="YYYY-MM-DD"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                        <input
                          type="date"
                          ref={birthdayRef}
                          style={{ display: 'none' }}
                          onChange={(e) => setFormData((prev) => ({ ...prev, birthday: formatDate(e.target.value) }))}
                        />
                        <button
                          type="button"
                          onClick={() => handleDatePicker('birthday', birthdayRef)}
                          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          📅
                        </button>
                      </div>
                    ) : (
                      <input
                        type="date"
                        id="birthday"
                        name="birthday"
                        value={formData.birthday || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="marriage_anniversary" className="block text-sm font-medium text-gray-700">
                      Marriage Anniversary
                    </label>
                    {isMobile ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          id="marriage_anniversary"
                          name="marriage_anniversary"
                          value={formData.marriage_anniversary || ''}
                          onChange={handleChange}
                          pattern="\d{4}-\d{2}-\d{2}"
                          placeholder="YYYY-MM-DD"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                        <input
                          type="date"
                          ref={marriageAnniversaryRef}
                          style={{ display: 'none' }}
                          onChange={(e) => setFormData((prev) => ({ ...prev, marriage_anniversary: formatDate(e.target.value) }))}
                        />
                        <button
                          type="button"
                          onClick={() => handleDatePicker('marriage_anniversary', marriageAnniversaryRef)}
                          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          📅
                        </button>
                      </div>
                    ) : (
                      <input
                        type="date"
                        id="marriage_anniversary"
                        name="marriage_anniversary"
                        value={formData.marriage_anniversary || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: All other sections */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone_country_code" className="block text-sm font-medium text-gray-700">
                        Country Code <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="phone_country_code"
                        name="phone_country_code"
                        value={formData.phone_country_code || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      >
                        <option value="">Select code</option>
                        {sortedCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number || ''}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="email_id" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email_id"
                      name="email_id"
                      value={formData.email_id || ''}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Professional Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="current_occupation" className="block text-sm font-medium text-gray-700">
                        Occupation
                      </label>
                      <input
                        type="text"
                        id="current_occupation"
                        name="current_occupation"
                        value={formData.current_occupation || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter your occupation"
                      />
                    </div>
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter your company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="job_role" className="block text-sm font-medium text-gray-700">
                        Job Role
                      </label>
                      <input
                        type="text"
                        id="job_role"
                        name="job_role"
                        value={formData.job_role || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter your job role"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Social Media</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="social_media_1" className="block text-sm font-medium text-gray-700">
                        Social Media 1
                      </label>
                      <input
                        type="url"
                        id="social_media_1"
                        name="social_media_1"
                        value={formData.social_media_1 || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter social media URL"
                      />
                    </div>
                    <div>
                      <label htmlFor="social_media_2" className="block text-sm font-medium text-gray-700">
                        Social Media 2
                      </label>
                      <input
                        type="url"
                        id="social_media_2"
                        name="social_media_2"
                        value={formData.social_media_2 || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter social media URL"
                      />
                    </div>
                    <div>
                      <label htmlFor="social_media_3" className="block text-sm font-medium text-gray-700">
                        Social Media 3
                      </label>
                      <input
                        type="url"
                        id="social_media_3"
                        name="social_media_3"
                        value={formData.social_media_3 || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter social media URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Family Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="spouse_name" className="block text-sm font-medium text-gray-700">
                        Spouse Name
                      </label>
                      <input
                        type="text"
                        id="spouse_name"
                        name="spouse_name"
                        value={formData.spouse_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter spouse name"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="child_1_name" className="block text-sm font-medium text-gray-700">
                          Child 1 Name
                        </label>
                        <input
                          type="text"
                          id="child_1_name"
                          name="child_1_name"
                          value={formData.child_1_name || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child name"
                        />
                      </div>
                      <div>
                        <label htmlFor="child_1_age" className="block text-sm font-medium text-gray-700">
                          Child 1 Age
                        </label>
                        <input
                          type="number"
                          id="child_1_age"
                          name="child_1_age"
                          value={formData.child_1_age || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child age"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="child_2_name" className="block text-sm font-medium text-gray-700">
                          Child 2 Name
                        </label>
                        <input
                          type="text"
                          id="child_2_name"
                          name="child_2_name"
                          value={formData.child_2_name || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child name"
                        />
                      </div>
                      <div>
                        <label htmlFor="child_2_age" className="block text-sm font-medium text-gray-700">
                          Child 2 Age
                        </label>
                        <input
                          type="number"
                          id="child_2_age"
                          name="child_2_age"
                          value={formData.child_2_age || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child age"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="child_3_name" className="block text-sm font-medium text-gray-700">
                          Child 3 Name
                        </label>
                        <input
                          type="text"
                          id="child_3_name"
                          name="child_3_name"
                          value={formData.child_3_name || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child name"
                        />
                      </div>
                      <div>
                        <label htmlFor="child_3_age" className="block text-sm font-medium text-gray-700">
                          Child 3 Age
                        </label>
                        <input
                          type="number"
                          id="child_3_age"
                          name="child_3_age"
                          value={formData.child_3_age || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                          placeholder="Enter child age"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Additional Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="special_message" className="block text-sm font-medium text-gray-700">
                        Special Message
                      </label>
                      <textarea
                        id="special_message"
                        name="special_message"
                        value={formData.special_message || ''}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="Enter a special message"
                      />
                    </div>
                    <div>
                      <label htmlFor="latest_photo" className="block text-sm font-medium text-gray-700">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        id="latest_photo"
                        name="latest_photo"
                        onChange={handleChange}
                        accept="image/*"
                        className="mt-1 block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formData.latest_photo_url && (
                        <div className="mt-2 flex items-center space-x-2">
                          <img src={formData.latest_photo_url} alt="Current Profile" className="w-16 h-16 object-cover rounded-full border border-gray-300" />
                          <span className="text-sm text-gray-500">Current photo uploaded. Upload new to change.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div> {/* This closing div was previously missing from the end of the right column */}

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;