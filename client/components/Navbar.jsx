import React from 'react';

const Navbar = () => (
  <nav className="bg-blue-600 p-4">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-white text-2xl font-bold">Aphians</h1>
      <div>
        {window.location.pathname !== '/' && (
          <button 
            onClick={() => window.location.href = '/'}
            className="text-white bg-blue-700 px-4 py-2 rounded hover:bg-blue-800"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  </nav>
);

export default Navbar;