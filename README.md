# A Contact Portal for classmates of 10th F from Saraswati Bhuvan High School from 1992 batch

A modularized web application for managing school classmates' contact information.

## Structure
- `client/`: React frontend
- `server/`: Node.js backend
- `database/`: MySQL schema

## Setup
1. **Backend**:
   - Navigate to `server/`
   - Install dependencies: `npm install`
   - Update `src/config/db.js` with MySQL credentials
   - Run MySQL schema: `mysql -u root -p < database/schema.sql`
   - Update auth credentials in `src/auth/passport.js`
   - Start server: `npm start`

2. **Frontend**:
   - Navigate to `client/`
   - Install dependencies: `npm install`
   - Start development server: `npm start`

3. **Environment**:
   - Create `.env` files in `client/` and `server/` for sensitive data

## Notes
- Replace `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET` with actual credentials
- Add configurations for Facebook, Apple, and Yahoo authentication as needed
- Ensure MySQL server is running
