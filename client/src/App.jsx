// import { useState } from 'react'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div className='bg-red-500'>
//         <h1>Hello There</h1>
//       </div>
//       <p className="mx-auto bg-blue-400">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import React, { useState, useEffect } from 'react';
   import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
   import Navbar from './components/Navbar';
   import LandingPage from './components/LandingPage';
   import ProfileForm from './components/ProfileForm';
   import ProfilePage from './components/ProfilePage';
   import CommunityHub from './components/CommunityHub';
   import Footer from './components/Footer';
   import PrivacyPolicy from './components/legal/PrivacyPolicy';
   import TermsOfUse from './components/legal/TermsOfUse';
   import DataDeletion from './components/legal/DataDeletion';

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
       <div className="flex flex-col bg-white h-full">
         <Router>
         <Navbar currentUser={currentUser} />
         <main className="flex-grow">
           <Routes>
             <Route path="/aphians" element={<LandingPage currentUser={currentUser}/>} />
             <Route path="/aphians/profile/:userId" element={<ProfilePage currentUser={currentUser} />} />
             <Route path="/aphians/edit-profile" element={<ProfileForm currentUser={currentUser} />} />
             <Route path="/aphians/community" element={<CommunityHub currentUser={currentUser} />} />
             <Route path="/aphians/privacy-policy" element={<PrivacyPolicy />} />
             <Route path="/aphians/terms-of-use" element={<TermsOfUse />} />
             <Route path="/aphians/data-deletion-instructions" element={<DataDeletion />} /> 
             <Route path="*" element={<Navigate to="/aphians" />} />
           </Routes>
         </main>
           <Footer />
         </Router>
       </div>
     );
   };

   export default App;