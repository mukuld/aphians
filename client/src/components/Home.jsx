import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Welcome to Aphians</h1>
      <p className="text-lg text-gray-600 mb-4 text-center">
        Connect with the community, view profiles, and share your story.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/aphians/community"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Community Hub
        </Link>
        <Link
          to="/aphians/login"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    </div>
  );
};

export default Home;