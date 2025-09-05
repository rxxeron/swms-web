# Student Wellness Management System (SWMS) - Web Application

A comprehensive full-stack web application for managing student mental health and wellness, built with React (frontend) and Node.js/Express (backend) with PostgreSQL database.

## 🚀 Features

### 👑 Admin Features
- Secure login with hardcoded credentials
- Add and manage faculty members with course assignments
- Add and manage consultants
- View, search, and delete all users (Students, Faculty, Consultants)
- Dashboard with comprehensive statistics

### 🎓 Student Features
- Registration and login system
- Interactive mood entry with emoji slider (1-10 scale)
- Automatic consultation recommendations for low mood (< 4)
- Comprehensive mood history with filtering (Today, 7 days, 30 days, 90 days)
- View recommendations (auto-generated and faculty-assigned)
- Book appointments with consultants
- Accept/decline consultant-scheduled appointments with counter-proposals

### 👨‍🏫 Faculty Features
- Login system for course instructors
- View average mood levels for assigned course sections
- Identify vulnerable students (7-day average mood < 4)
- Recommend students for consultation
- Recommendation cooldown system (1 week after appointment)

### 👩‍⚕️ Consultant Features
- Login system for mental health consultants
- View and manage pending recommendations
- Schedule appointments from recommendations
- Manage direct appointment requests from students
- Accept/reject appointment requests and counter-proposals
- Calendar view of scheduled appointments

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM
- **UI Framework**: React Bootstrap
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Notifications**: React Toastify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL (v12 or higher)
- Git

## 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**
   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres
   
   # Create database
   CREATE DATABASE swms_db;
   
   # Create user (optional)
   CREATE USER swms_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE swms_db TO swms_user;
   
   # Exit PostgreSQL
   \q
   ```

3. **Setup Database Schema**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Run schema creation
   psql -U postgres -d swms_db -f database/schema.sql
   
   # Insert sample data
   psql -U postgres -d swms_db -f database/seeds.sql
   ```

## ⚙️ Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

   Update the following variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=swms_db
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
   JWT_EXPIRES_IN=24h
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

   The backend server will start on `http://localhost:5000`

## 🎨 Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # The .env file is already configured for local development
   # Verify the API URL in .env:
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server**
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`

## 🔐 Default Credentials

### Admin Access
- **Username**: `admin_swms`
- **Password**: `swmsewu2025`

### Demo Student Account
- **Username**: `alice_johnson`
- **Password**: `password123`

### Demo Faculty Account
- **Username**: `john_smith`
- **Password**: `password123`

### Demo Consultant Account
- **Username**: `sarah_johnson`
- **Password**: `password123`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Student registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `POST /api/admin/faculty` - Add faculty
- `POST /api/admin/consultant` - Add consultant
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics

### Student Endpoints
- `POST /api/student/mood` - Add mood entry
- `GET /api/student/mood` - Get mood history
- `GET /api/student/recommendations` - Get recommendations
- `POST /api/student/appointments` - Book appointment
- `PUT /api/student/appointments/:id/respond` - Respond to appointment

### Faculty Endpoints
- `GET /api/faculty/mood-stats` - Get section mood statistics
- `GET /api/faculty/vulnerable-students` - Get vulnerable students
- `POST /api/faculty/recommendations` - Create recommendation

### Consultant Endpoints
- `GET /api/consultant/recommendations` - Get pending recommendations
- `POST /api/consultant/schedule-appointment` - Schedule appointment
- `GET /api/consultant/appointments` - Get appointments
- `PUT /api/consultant/appointments/:id` - Update appointment

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🏗️ Development Workflow

1. **Start Database**: Ensure PostgreSQL is running
2. **Start Backend**: `cd backend && npm run dev`
3. **Start Frontend**: `cd frontend && npm start`
4. **Access Application**: Open `http://localhost:3000`

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Update CORS_ORIGIN to your frontend domain
3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name swms-backend
   ```

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Serve the `build` folder using a web server (nginx, Apache, etc.)

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Backend: Change `PORT` in backend `.env`
   - Frontend: Set `PORT=3001` in frontend `.env`

3. **CORS Errors**
   - Verify `CORS_ORIGIN` in backend `.env`
   - Ensure frontend URL matches CORS origin

4. **JWT Token Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in backend `.env`

### Debug Mode

Enable debug logging:
```bash
# Backend
DEBUG=swms:* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## 📝 System Rules

1. **Uniqueness**: Usernames, emails, and student IDs must be unique system-wide
2. **Recommendation Cooldown**: Students cannot be recommended again for one week after a scheduled appointment
3. **Mood Threshold**: Mood levels below 4 automatically generate consultation recommendations
4. **Appointment Conflicts**: Real-time conflict detection prevents double booking
5. **Role-Based Access**: Strict access control based on user roles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Note**: This application is designed for educational and demonstration purposes. For production use in a real healthcare environment, additional security measures, compliance considerations (HIPAA, etc.), and professional review would be required.
