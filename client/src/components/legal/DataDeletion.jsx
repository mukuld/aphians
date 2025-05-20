// src/components/DataDeletion.jsx
import React from 'react';

const DataDeletion = () => {
  return (
    <div className="container mx-auto p-8 my-8 bg-white rounded-lg shadow-lg text-gray-800">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Data Deletion Instructions - Aphians</h1>
      <p className="text-sm text-gray-600 mb-6">Last Updated: May 19, 2025</p>
      <p className="mb-4">As Aphians is a personal project by Mukul Dharwadkar to reconnect the 1992 batch of Saraswati Bhuvan High School, Chhatrapati Sambhajinagar, Maharashtra, India, you can request deletion of your data as follows:</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Steps to Delete Your Data</h2>
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>Send an email to [mukul@dharwadkar.com] with the subject "Data Deletion Request."</li>
        <li>Include your name and the email address associated with your Aphians account.</li>
        <li>We will delete your profile and associated data from our database within 7 business days and confirm via email.</li>
      </ol>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Notes</h2>
      <p className="mb-4">This process removes your data from Aphians. Data deletion cannot be undone. For further assistance, contact us at the email above.</p>
    </div>
  );
};

export default DataDeletion;