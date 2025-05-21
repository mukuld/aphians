import googleLogo from "../assets/google-logo-signin-sq.png";
import googleLogoMobile from "../assets/google-logo-signin-sq-g.png"
// import facebookLogo from "../assets/facebook-logo-f.png";
import sbSchool from "../assets/sbhs.jpg";

const LandingPage = ({ currentUser }) => (
  <div className="bg-gray-100 flex items-center justify-center min-h-full p-4">
    {/* <NavBar currentUser={currentUser}/> */}
    {/* <div> */}
    <div className="fixed top-4 right-4 z-10">
      <a
        href="/aphians/auth/google"
        className="flex items-center justify-center p-2 transition duration-300"
      >
        {/* Desktop Logo */}
        <img src={googleLogo} alt="Google Login" className="md:block hidden"/>
        {/* Mobile Logo */}
        <img src={googleLogoMobile} alt="Google Login" className="h-10 w-10 md:hidden block" />
      </a>
    </div>
      {/* <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl"> */}
      <div className="max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden mb-8">
        {/* Image Section */}
        <div className="relative w-full">
          <img
            src={sbSchool}
            alt="Saraswati Bhuvan High School, Aurangabad"
            className="items-center justify-center w-full object-cover"
          />
        </div>
      <h1 className="text-4xl text-center justify-center font-bold mb-6 mt-6 text-gray-900">Welcome Aphians - Reconnecting the 1992 Batch!</h1>
      <div className="text-lg text-gray-700 m-2 leading-relaxed">

      <p>
          Step back into the cherished halls of SB High School in Aurangabad — now proudly known as <a href="https://en.wikipedia.org/wiki/Chhatrapati_Sambhajinagar" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Chhatrapati Sambhajinagar</a> — where memories of laughter, learning, and friendship were forged. This site is a heartfelt tribute to our alma mater <a href="https://www.saraswatibhuvan.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SB High School</a>, offering a space to reconnect with old friends.</p>
          <p>Beyond just reconnecting, I am envisioning Aphians portal to be a vibrant hub for our batch. Share your journey, update your details, and relive those golden days. Looking ahead, I am planning to introduce features like planning meetups, uploading photos from gatherings, sharing news, and reminding us of birthdays and anniversaries to keep our bond alive across the years and across the lands.
        </p>
        <p>I'd like all of you to engage and share your ideas and feedback to make it a living and breathing project and not just a placeholder.</p>
      </div>
        {/* <div className="flex flex-col items-center space-y-4"> */}
          {/* <div className="flex space-x-4">
            <a
              href="/aphians/auth/google"
              className="flex items-center justify-center rounded-full transition ease-in-out duration-300">
              <img
                src={googleLogo} // Update with your local path
                alt="Google Logo"
                // className="h-8 w-8"
              />
            </a> */}
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
          {/* </div> */}
        {/* </div> */}
      </div>
    {/* </div> */}
  </div>
);

export default LandingPage;