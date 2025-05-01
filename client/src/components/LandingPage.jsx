import React from 'react';
import Navbar from './Navbar';

const LandingPage = () => (
  <div className="min-h-screen bg-gray-100 flex flex-col">
    <Navbar />
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-4xl font-bold mb-4 text-gray-800">Welcome to Aphians</h2>
        <p className="text-lg text-gray-600 mb-8">
          Reconnect with your school friends! Share memories, update your contact details, 
          and stay connected with your classmates.
        </p>
        <div className="space-x-4">
          <a href="/auth/google" 
             className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign Up / Login with Google
          </a>
          <a href="/auth/facebook" 
             className="bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900">
            Sign Up / Login with Facebook
          </a>
          <a href="/auth/apple" 
             className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
            Sign Up / Login with Apple
          </a>
          {/* <a href="/auth/yahoo" 
             className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Sign Up / Login with Yahoo
          </a> */}
        </div>
      </div>
    </div>
  </div>
);

export default LandingPage;