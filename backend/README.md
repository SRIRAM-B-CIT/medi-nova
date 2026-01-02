# MediNova Backend API

Backend API server for MediNova Healthcare platform using Node.js, Express, and MongoDB.

## Features

- JWT-based authentication
- User management (Doctors & Patients)
- Patient health records
- Medication reminders
- RESTful API architecture

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the MongoDB URI and other settings

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

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

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `FRONTEND_URL` - Frontend URL for CORS
