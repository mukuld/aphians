import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import schoolLogo from "../assets/sb-10f-logonogb.png";
import schoolLogo from "../assets/sb-10f-logonobg.png";

// const Navbar = ({ currentUser }) => (
//   <nav className="bg-blue-300 text-grey-900 p-4">
//     <div className="container mx-auto flex justify-between items-center">
//       <h1 className="text-white text-2xl font-bold">Aphians</h1>
//       <div>
//         {window.location.pathname !== '/' && (
//           <button 
//             onClick={() => window.location.href = '/'}
//             className="text-white bg-orange-400 px-4 py-2 rounded hover:bg-orange-600"
//           >
//             Logout
//           </button>
//         )}
//       </div>
//     </div>
//   </nav>
// );

const Navbar = ({ currentUser }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/aphians";

return (
  <nav className="bg-blue-300 p-4">
    <div className="container mx-auto flex justify-between items-center">
      <Link to ="/aphians">
      <img
        src={schoolLogo}
        alt="10F logo"
        className="h-20 object-contain mr-6"
        />
      </Link>
      <div className="flex-grow flex items-center justify-center">
        {/* <div className="text-center p-8 rounded-lg shadow-lg max-w-2xl"> */}
          <h2 className="text-2xl font-bold text-white">Portal for 1992 10<sup>th</sup> F batchmates</h2>
        {/* </div> */}
      </div>
    <div className="flex items-center space-x-4">
        {/* Navigation Links */}
        {/* <Link to="/aphians/community" className="text-gray-700 hover:text-blue-500 font-medium">Community</Link> */}
        {/* Add more navigation links here as needed, e.g., <Link to="/aphians/about">About</Link> */}

        {/* Conditional Logout Button */}
        {/* The logout button only appears if currentUser exists and is authenticated */}
        {currentUser && !isLandingPage && (
          <a href="/aphians/auth/logout" className='link cursor-pointer'><button
            className="bg-orange-400 text-white px-4 py-2 rounded-md hover:bg-ora-600 transition duration-200"
          >
            Logout
          </button></a>
        )}
      </div>
    </div>
  </nav>
);
};
export default Navbar;