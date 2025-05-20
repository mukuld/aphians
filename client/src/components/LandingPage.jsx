import React from 'react';
// import NavBar from "./Navbar";
import googleLogo from "../assets/google-logo-signin-sq.png";
import facebookLogo from "../assets/facebook-logo-f.png";

const LandingPage = ({ currentUser }) => (
  <div className="bg-gray-100 flex items-center justify-center min-h-full p-4">
    {/* <NavBar currentUser={currentUser}/> */}
    {/* <div> */}
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Welcome to Aphians</h2>
        <p className="text-lg text-gray-600 mb-8">
          Reconnect with your school friends! Share memories, update your contact details,
          and stay connected with your classmates.
        </p>
        <div className="flex flex-col items-center space-y-4">
          {/* <span className="text-lg font-medium text-gray-700">Sign in with</span> */}
          <div className="flex space-x-4">
            <a
              href="/aphians/auth/google"
              className="flex items-center justify-center rounded-full transition ease-in-out duration-300">
              <img
                src={googleLogo} // Update with your local path
                alt="Google Logo"
                // className="h-8 w-8"
              />
            </a>
            {/* <a
              href="/aphians/auth/facebook"
              className="flex items-center justify-center rounded-full h-12 w-12 transition ease-in-out duration-300"
            >
              <img
                src={facebookLogo} // Update with your local path
                alt="Facebook Logo"
                className="h-8 w-8"
              />
            </a> */}
          </div>
        </div>
      </div>
    {/* </div> */}
  </div>
);

export default LandingPage;