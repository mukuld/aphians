// src/components/PrivacyPolicy.jsx
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto p-8 my-8 bg-white rounded-lg shadow-lg text-gray-800">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Privacy Policy - Aphians</h1>
      <p className="text-sm text-gray-600 mb-6">Last Updated: May 19, 2025</p>
      <p className="mb-4">This privacy policy applies to the Aphians portal, a personal project created by Mukul Dharwadkar to help classmates from the 1992 batch of Saraswati Bhuvan High School, Chhatrapati Sambhajinagar, Maharashtra, India, reconnect.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Information We Collect</h2>
      <p className="mb-4">We collect only the basic information provided by Facebook authentication, including your name, email address, and Facebook ID, to create a profile for reconnecting with classmates. No other personal data is collected or stored.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">How We Use Your Information</h2>
      <p className="mb-4">The collected information is used solely to facilitate communication among 1992 batch classmates. It is not shared, sold, or used for any commercial purposes.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Data Security</h2>
      <p className="mb-4">We take reasonable measures to protect your information, but as this is a personal project, it is not hosted on enterprise-grade infrastructure. Data is stored in a database accessible only to the project creator.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Your Rights</h2>
      <p className="mb-4">You can request deletion of your data by following the instructions at <a href="/aphians/data-deletion-instructions" className="text-blue-600 hover:underline">Data Deletion Instructions</a>.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Contact Us</h2>
      <p className="mb-4">For any questions, contact Mukul Dharwadkar at [mukul@dharwadkar.com].</p>
    </div>
  );
};

export default PrivacyPolicy;