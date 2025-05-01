import React, { useState } from 'react';

const ProfileForm = ({ profile, onSave }) => {
  const [formData, setFormData] = useState(profile || {});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formDataToSend
      });
      if (response.ok) {
        onSave(formData);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
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
        <input name="birthday" type="date" value={formData.birthday || ''} onChange={handleChange} 
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
        <input name="child_1_age" type="number" value={formData.child_1_age || ''} onChange={handleChange} 
          placeholder="Child 1 Age" className="p-2 border rounded" />
        <input name="child_2_age" type="number" value={formData.child_2_age || ''} onChange={handleChange} 
          placeholder="Child 2 Age" className="p-2 border rounded" />
        <textarea name="special_message" value={formData.special_message || ''} onChange={handleChange} 
          placeholder="Special Message for Friends" className="p-2 border rounded col-span-2" />
        <input name="latest_photo" type="file" onChange={handleChange}  className="p-2 border rounded" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Save Profile
      </button>
    </form>
  );
};

export default ProfileForm;