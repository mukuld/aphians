// src/components/TermsOfUse.jsx
import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="container mx-auto p-8 my-8 bg-white rounded-lg shadow-lg text-gray-800">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Terms of Use - Aphians</h1>
      <p className="text-sm text-gray-600 mb-6">Last Updated: May 19, 2025</p>
      <p className="mb-4">These terms of use govern your use of the Aphians portal, a personal project by Mukul Dharwadkar to reconnect the 1992 batch of Saraswati Bhuvan High School, Chhatrapati Sambhajinagar, Maharashtra, India.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Acceptance of Terms</h2>
      <p className="mb-4">By using Aphians, you agree to these terms. If you do not agree, please do not use the portal.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Use of Service</h2>
      <p className="mb-4">Aphians is provided free of charge for the purpose of reconnecting classmates. You may use it to share contact details and memories, but you must not misuse it for commercial purposes or harassment.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Account Responsibility</h2>
      <p className="mb-4">You are responsible for maintaining the confidentiality of your account and for all activities that occur under it.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Termination</h2>
      <p className="mb-4">We reserve the right to terminate or suspend your access if you violate these terms.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Data Deletion</h2>
      <p className="mb-4">You can request deletion of your data as outlined at <a href="/aphians/data-deletion-instructions" className="text-blue-600 hover:underline">Data Deletion Instructions</a>.</p>

      <h2 className="text-2xl font-semibold mb-3 mt-6 text-gray-900">Contact Us</h2>
      <p className="mb-4">For questions, contact Mukul Dharwadkar at mukul@dharwadkar.com.</p>
    </div>
  );
};

export default TermsOfUse;