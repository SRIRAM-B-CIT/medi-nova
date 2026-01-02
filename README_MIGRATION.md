# MediNova - Healthcare Platform Migration Guide

## 🔄 Migration from Supabase to MongoDB

This project has been successfully migrated from Supabase to MongoDB with a custom Node.js/Express backend.

## 📋 Project Structure

```
medinovazip/
├── backend/                 # Node.js Express API Server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Server entry point
│   ├── .env                # Backend environment variables
│   ├── .env.example        # Example environment variables
│   └── package.json        # Backend dependencies
│
├── src/                    # React Frontend (Vite)
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks (useAuth updated)
│   ├── lib/                # API client for backend
│   ├── pages/              # Page components
│   └── ...
│
└── README_MIGRATION.md     # This file
```

## 🚀 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables are already configured:**
   - MongoDB URI: `mongodb+srv://srirambcse2024_db_user:uiyooPsd4rJDc06y@cluster0.xw8vklw.mongodb.net/?appName=Cluster0`
   - Port: `5000`
   - JWT Secret is set (change in production!)

4. **Start the backend server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # OR Production mode
   npm start
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install frontend dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## 🔑 Key Changes

### Authentication
- **Before:** Supabase Auth
- **After:** JWT-based authentication with bcrypt password hashing

### Database
- **Before:** PostgreSQL (Supabase)
- **After:** MongoDB Atlas

### API Structure
- **Before:** Direct Supabase client calls from frontend
- **After:** RESTful API with Express backend

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/verify` - Verify JWT token

### Patient Details
- `GET /api/patient-details` - Get current user's patient details
- `GET /api/patient-details/check` - Check if health record exists
- `GET /api/patient-details/:userId` - Get patient details by user ID (doctors only)
- `POST /api/patient-details` - Create/update patient details

### Medication Reminders
- `GET /api/medication-reminders` - Get all reminders
- `GET /api/medication-reminders/:id` - Get specific reminder
- `POST /api/medication-reminders` - Create new reminder
- `PUT /api/medication-reminders/:id` - Update reminder
- `DELETE /api/medication-reminders/:id` - Delete reminder

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Protected routes with auth middleware
- Role-based access control (Doctor/Patient)
- CORS configuration for frontend

## 🗄️ Database Schema

### Collections

#### Users
- email
- password (hashed)
- full_name
- role (doctor/non_medic)
- created_at
- updated_at

#### PatientDetails
- user_id (reference to User)
- age
- gender
- blood_group
- height
- weight
- allergies (array)
- chronic_conditions (array)
- current_medications (array)
- emergency_contact_name
- emergency_contact_phone
- emergency_contact_relation

#### MedicationReminders
- patient_id (reference to User)
- created_by (reference to User)
- medication_name
- dosage
- reminder_type
- reminder_times (array)
- interval_hours
- schedule_pattern
- start_date
- end_date
- is_active
- notes

## 🛠️ Development

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Environment Variables

**Backend (.env in backend folder):**
```env
MONGODB_URI=mongodb+srv://srirambcse2024_db_user:uiyooPsd4rJDc06y@cluster0.xw8vklw.mongodb.net/?appName=Cluster0
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env in root folder):**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Migration Notes

### What Was Changed

1. **Authentication System:**
   - Replaced `src/hooks/useAuth.tsx` to use JWT instead of Supabase auth
   - Created `src/lib/apiClient.ts` for API communication

2. **Components Updated:**
   - `src/pages/PatientDetails.tsx` - Now uses API client
   - `src/pages/DoctorDashboard.tsx` - Updated to fetch from API
   - `src/components/MedicationReminder.tsx` - All CRUD operations use API

3. **Backend Created:**
   - Complete Express.js server with MongoDB
   - Mongoose models for data structure
   - JWT authentication middleware
   - RESTful API endpoints

### What Was Kept

- All UI components remain the same
- Frontend routing structure unchanged
- Component styling and design intact
- Application features and functionality preserved

## ⚠️ Important Notes

1. **JWT Secret:** Change `JWT_SECRET` in production to a strong random string
2. **CORS:** Configure `FRONTEND_URL` for production domain
3. **MongoDB URI:** Current URI is configured, but consider using environment-specific databases
4. **Token Storage:** JWT tokens are stored in localStorage
5. **Session Management:** Tokens expire after 7 days (configurable)

## 🧪 Testing

1. **Create a new account:**
   - Go to `/auth`
   - Sign up as patient or doctor
   - Backend will create user in MongoDB

2. **Login:**
   - Use created credentials
   - Token will be stored in localStorage

3. **Test features:**
   - Patient: Fill out health details, create medication reminders
   - Doctor: View patient list, manage medication reminders

## 📚 Dependencies

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- cors - CORS middleware
- dotenv - Environment variables

### Frontend
- Existing dependencies remain the same
- No new dependencies added

## 🔄 Future Enhancements

- [ ] Add refresh token mechanism
- [ ] Implement email verification
- [ ] Add password reset functionality
- [ ] Add real-time notifications with WebSockets
- [ ] Implement file upload for medical documents
- [ ] Add comprehensive API documentation (Swagger)
- [ ] Add unit and integration tests

## 📞 Support

If you encounter any issues during migration or setup:
1. Check that MongoDB URI is accessible
2. Ensure both servers are running
3. Verify environment variables are set correctly
4. Check browser console and server logs for errors

---

**Status:** ✅ Migration Complete - Both backend and frontend are fully configured and ready to use!
