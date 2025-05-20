import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-blue-300 text-white p-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">© 2025 Mukul Dharwadkar. All rights reserved.</p>
        <div className="space-x-4 mt-2 text-white">
          <Link to="/aphians/community" className="link hover:underline">Home</Link>
          <Link to="/aphians/profile" className="link hover:underline">Profile</Link>
          <Link to="/aphians/privacy-policy" className="link hover:underline">Privacy Policy</Link>
          <Link to="/aphians/terms-of-use" className="link hover:underline">Terms of Use</Link>
          <Link to="/aphians/data-deletion-instructions" className="link hover:underline">Data Deletion</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;