// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import LandingPage from './components/LandingPage';
// import ProfileForm from './components/ProfileForm';
// import ProfilePage from "./components/ProfilePage";
// import CommunityHub from './components/CommunityHub';


// const App = () => {
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       try {
//         const response = await fetch('/aphians/api/auth/current', {
//           credentials: 'include'
//         });
//         if (response.ok) {
//           const data = await response.json();
//           if (data.isAuthenticated) {
//             setCurrentUser(data.user);
//             console.log('App.jsx: Current user fetched:', data.user); // Log to verify
//           } else {
//             setCurrentUser(null); // Corrected: `nul` to `null`
//             console.log("App.jsx: No active session found or user not authenticated.");
//           }
//         } else {
//           console.log("App.jsx: Failed to fetch current user or no active session found (response not ok):", response.status);
//           setCurrentUser(null); // Ensure currentUser is null if fetch fails or isn't authenticated
//         }
//       } catch (err) {
//         console.error('Error fetching current user:', err);
//         setCurrentUser(null); // Ensure currentUser is null on network/parsing error
//       }
//     };
//     fetchCurrentUser();
//   }, []);

//   return (
//     <Router>
//       <Routes>
//         {/* Landing page (e.g., for login/registration) */}
//         <Route path="/aphians" element={<LandingPage />} />

//         {/* Route for viewing any profile by ID */}
//         <Route path="/aphians/profile/:userId" element={<ProfilePage currentUser={currentUser} />} />

//         {/* Route for editing the current user's profile */}
//         {/* Changed from "/aphians/profile" to "/aphians/edit-profile" */}
//         <Route path="/aphians/edit-profile" element={<ProfileForm currentUser={currentUser} />} />

//         {/* Route for the main community hub */}
//         <Route path="/aphians/community" element={<CommunityHub currentUser={currentUser} />} />

//         {/* Fallback for any unmatched routes - redirects to the landing page */}
//         <Route path="*" element={<Navigate to="/aphians" />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

import React, { useState, useEffect } from 'react';
   import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
   import LandingPage from './components/LandingPage';
   import ProfileForm from './components/ProfileForm';
   import ProfilePage from './components/ProfilePage';
   import CommunityHub from './components/CommunityHub';

   const App = () => {
     const [currentUser, setCurrentUser] = useState(null);

     useEffect(() => {
       const fetchCurrentUser = async () => {
         try {
           const response = await fetch('/aphians/api/auth/current', {
             credentials: 'include'
           });
           if (response.ok) {
             const data = await response.json();
             if (data.isAuthenticated) {
               setCurrentUser(data.user);
               console.log('App.jsx: Current user fetched:', data.user);
             } else {
               setCurrentUser(null);
               console.log("App.jsx: No active session found or user not authenticated.");
             }
           } else {
             console.log("App.jsx: Failed to fetch current user or no active session found (response not ok):", response.status);
             setCurrentUser(null);
           }
         } catch (err) {
           console.error('Error fetching current user:', err);
           setCurrentUser(null);
         }
       };
       fetchCurrentUser();
     }, []);

     return (
       <div className="min-h-screen text-blue-500">
         <Router>
           <Routes>
             <Route path="/aphians" element={<LandingPage />} />
             <Route path="/aphians/profile/:userId" element={<ProfilePage currentUser={currentUser} />} />
             <Route path="/aphians/edit-profile" element={<ProfileForm currentUser={currentUser} />} />
             <Route path="/aphians/community" element={<CommunityHub currentUser={currentUser} />} />
             <Route path="*" element={<Navigate to="/aphians" />} />
           </Routes>
         </Router>
       </div>
     );
   };

   export default App;