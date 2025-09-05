# Student Wellness Management System (SWMS) - Web Application

## Project Structure

```
swms-web/
├── backend/                    # Node.js Express Backend
│   ├── config/                 # Configuration files
│   │   ├── database.js         # Database configuration
│   │   └── jwt.js              # JWT configuration
│   ├── controllers/            # Route controllers
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management
│   │   ├── moodController.js   # Mood entries
│   │   ├── recommendationController.js # Recommendations
│   │   └── appointmentController.js    # Appointments
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js             # Authentication middleware
│   │   ├── rbac.js             # Role-based access control
│   │   └── validation.js       # Input validation
│   ├── models/                 # Database models
│   │   ├── User.js             # User model
│   │   ├── Course.js           # Course model
│   │   ├── MoodEntry.js        # Mood entry model
│   │   ├── Recommendation.js   # Recommendation model
│   │   └── Appointment.js      # Appointment model
│   ├── routes/                 # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── admin.js            # Admin routes
│   │   ├── student.js          # Student routes
│   │   ├── faculty.js          # Faculty routes
│   │   └── consultant.js       # Consultant routes
│   ├── utils/                  # Utility functions
│   │   ├── validators.js       # Input validators
│   │   ├── helpers.js          # Helper functions
│   │   └── emailService.js     # Email service
│   ├── database/               # Database files
│   │   ├── schema.sql          # Database schema
│   │   └── seeds.sql           # Sample data
│   ├── tests/                  # Test files
│   ├── package.json            # Backend dependencies
│   └── server.js               # Main server file
│
├── frontend/                   # React Frontend
│   ├── public/                 # Public assets
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable components
│   │   │   ├── common/         # Common components
│   │   │   │   ├── Navbar.js
│   │   │   │   ├── Footer.js
│   │   │   │   ├── LoadingSpinner.js
│   │   │   │   └── ConfirmModal.js
│   │   │   ├── forms/          # Form components
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── RegisterForm.js
│   │   │   │   └── MoodSlider.js
│   │   │   └── tables/         # Table components
│   │   │       ├── UserTable.js
│   │   │       └── DataTable.js
│   │   ├── pages/              # Page components
│   │   │   ├── auth/           # Authentication pages
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── admin/          # Admin pages
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── AddFaculty.js
│   │   │   │   ├── AddConsultant.js
│   │   │   │   └── UserManagement.js
│   │   │   ├── student/        # Student pages
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── MoodEntry.js
│   │   │   │   ├── MoodHistory.js
│   │   │   │   ├── Recommendations.js
│   │   │   │   └── Appointments.js
│   │   │   ├── faculty/        # Faculty pages
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── SectionMood.js
│   │   │   │   └── VulnerableStudents.js
│   │   │   └── consultant/     # Consultant pages
│   │   │       ├── Dashboard.js
│   │   │       ├── Recommendations.js
│   │   │       └── Appointments.js
│   │   ├── services/           # API services
│   │   │   ├── api.js          # Axios configuration
│   │   │   ├── authService.js  # Authentication API
│   │   │   ├── userService.js  # User management API
│   │   │   ├── moodService.js  # Mood API
│   │   │   ├── recommendationService.js # Recommendation API
│   │   │   └── appointmentService.js    # Appointment API
│   │   ├── context/            # React Context
│   │   │   ├── AuthContext.js  # Authentication context
│   │   │   └── AppContext.js   # Global app context
│   │   ├── hooks/              # Custom hooks
│   │   │   ├── useAuth.js      # Authentication hook
│   │   │   └── useApi.js       # API hook
│   │   ├── utils/              # Utility functions
│   │   │   ├── validators.js   # Form validators
│   │   │   ├── formatters.js   # Data formatters
│   │   │   └── constants.js    # App constants
│   │   ├── styles/             # CSS/SCSS files
│   │   │   ├── globals.css     # Global styles
│   │   │   ├── components.css  # Component styles
│   │   │   └── pages.css       # Page styles
│   │   ├── App.js              # Main App component
│   │   ├── App.css             # App styles
│   │   └── index.js            # Entry point
│   ├── package.json            # Frontend dependencies
│   └── .env                    # Environment variables
│
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── SETUP.md                # Setup instructions
│   └── DEPLOYMENT.md           # Deployment guide
├── README.md                   # Main README
└── .gitignore                  # Git ignore file
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: joi
- **CORS**: cors
- **Environment Variables**: dotenv

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **UI Components**: React Bootstrap / Material-UI
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns
- **Icons**: React Icons

### Development Tools
- **Code Formatting**: Prettier
- **Linting**: ESLint
- **Testing**: Jest, React Testing Library
- **Build Tool**: Create React App / Vite
- **Package Manager**: npm

## Key Features Implementation

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes for different user roles
- Secure password hashing

### Real-time Features
- Conflict detection for appointment booking
- Dynamic mood visualization
- Live data updates

### Data Management
- PostgreSQL database with proper indexing
- Optimized queries for performance
- Data validation and sanitization
- Proper error handling

### User Experience
- Responsive design for all devices
- Interactive components (mood slider, calendar)
- Real-time feedback and notifications
- Intuitive navigation and UI
