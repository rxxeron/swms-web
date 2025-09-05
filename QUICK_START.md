# Student Wellness Management System - Quick Start Guide

## 🚀 Complete Web Application Ready!

Your Student Wellness Management System (SWMS) web application is now complete with all frontend components for all user roles!

## 📁 What's Been Added

### ✅ Complete Frontend Components:
- **Admin Dashboard** - Full user and system management
- **Faculty Dashboard** - Student wellness monitoring and recommendations
- **Consultant Dashboard** - Appointment management and student insights
- **Enhanced Student Pages**:
  - Comprehensive dashboard with mood tracking
  - Detailed mood history with visual charts
  - Recommendation management system
  - Appointment booking interface

### ✅ New Features:
- **Windows Setup Script** (`setup.bat`) for easy installation
- **Enhanced Navigation** with role-based menus
- **Visual Mood Charts** in student mood history
- **Real-time Dashboards** for all user types
- **Appointment Booking System** with conflict detection
- **Recommendation Workflow** between faculty and students

## 🛠️ Installation & Setup

### Option 1: Windows Setup (Recommended)
```bash
# Run the automated setup script
setup.bat
```

### Option 2: Manual Setup
```bash
# Backend setup
cd backend
npm install
copy .env.example .env
# Edit .env with your database credentials

# Frontend setup
cd ../frontend
npm install
```

## 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create Database**:
   ```sql
   createdb swms_db
   ```
3. **Run Schema**:
   ```bash
   psql -U postgres -d swms_db -f backend/database/schema.sql
   ```
4. **Insert Sample Data**:
   ```bash
   psql -U postgres -d swms_db -f backend/database/seeds.sql
   ```

## 🏃‍♂️ Running the Application

### Option 1: Start Everything (Windows)
```bash
start-all.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Default Login Credentials

### Admin Account
- **Username**: admin_swms
- **Password**: swmsewu2025

### Test Student Account
- **Username**: john_doe
- **Password**: student123

### Test Faculty Account
- **Username**: jane_smith
- **Password**: faculty123

### Test Consultant Account
- **Username**: dr_johnson
- **Password**: consultant123

## 🎯 User Role Features

### 👨‍💼 Admin Dashboard
- **User Management**: Create, view, and manage all users
- **Course Management**: Oversee all courses and enrollments
- **System Analytics**: Monitor overall system health and usage
- **Appointment Overview**: View all appointments across the system

### 👨‍🎓 Student Features
- **Mood Tracking**: Interactive mood slider with daily entries
- **Mood History**: Visual charts showing mood trends over time
- **Recommendations**: View and respond to faculty recommendations
- **Appointment Booking**: Schedule consultations with available consultants
- **Dashboard**: Personalized wellness overview

### 👨‍🏫 Faculty Dashboard
- **Student Monitoring**: Track mood and wellness of enrolled students
- **Recommendation System**: Send targeted recommendations to students
- **Course Analytics**: View mood trends by course
- **Wellness Alerts**: Identify students needing attention

### 👨‍⚕️ Consultant Dashboard
- **Appointment Management**: Confirm, complete, and manage sessions
- **Schedule Management**: Set available time slots
- **Student Insights**: Track progress of students you've consulted
- **Session Notes**: Maintain detailed consultation records

## 🔧 Technical Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based with role-based access control
- **Database**: PostgreSQL with comprehensive schema
- **Security**: bcryptjs, helmet, rate limiting
- **Validation**: Joi schemas for all inputs

### Frontend (React)
- **State Management**: Context API for auth and app state
- **UI Framework**: React Bootstrap for responsive design
- **Routing**: React Router with protected routes
- **HTTP Client**: Axios for API communication

### Database Features
- **Role-based Access**: Admin, Student, Faculty, Consultant
- **Mood Tracking**: Daily entries with analytics
- **Recommendation System**: Faculty-to-student with feedback
- **Appointment System**: Booking with conflict detection
- **Course Management**: Student-course relationships

## 📊 Key Functionalities

### 1. Mood Tracking System
- Daily mood entries (1-10 scale)
- Visual trend analysis
- Automatic recommendations for low moods
- Faculty visibility into student wellness

### 2. Recommendation Engine
- Faculty can send targeted recommendations
- Students can accept/decline with feedback
- Priority levels (high, medium, low)
- Type categories (academic, wellness, personal)

### 3. Appointment System
- Consultants set available time slots
- Students book appointments based on availability
- Conflict detection and prevention
- Session notes and completion tracking

### 4. Analytics & Reporting
- Individual mood trends
- Course-level wellness analytics
- System-wide usage statistics
- Consultant performance metrics

## 🔐 Security Features

- **Password Security**: bcryptjs hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Fine-grained permissions per user type
- **Input Validation**: Comprehensive Joi schema validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests

## 🌟 Next Steps

Your SWMS application is now production-ready! You can:

1. **Deploy to Production**: Use platforms like Heroku, AWS, or DigitalOcean
2. **Add More Features**: Email notifications, mobile app, advanced analytics
3. **Customize UI**: Modify themes, add your institution's branding
4. **Scale Database**: Optimize queries and add indexes as needed
5. **Monitor Usage**: Add logging and monitoring solutions

## 📞 Support

If you encounter any issues:
1. Check the console logs in both frontend and backend
2. Verify database connection in the `.env` file
3. Ensure all dependencies are installed correctly
4. Check that PostgreSQL service is running

## 🎉 Congratulations!

You now have a fully functional Student Wellness Management System that can help monitor and improve student mental health and wellness across your institution!

---

**Built with ❤️ for student wellness and success**
