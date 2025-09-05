import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './context/AuthContext';

// Layout components
import AppNavbar from './components/common/AppNavbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentRecommendations from './pages/student/StudentRecommendations';
import StudentAppointments from './pages/student/StudentAppointments';
import StudentMoodHistory from './pages/student/StudentMoodHistory';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Consultant pages
import ConsultantDashboard from './pages/consultant/ConsultantDashboard';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Redirect based on user role
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'faculty':
      return <Navigate to="/faculty/dashboard" replace />;
    case 'consultant':
      return <Navigate to="/consultant/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Unauthorized page
const Unauthorized = () => (
  <div className="container mt-5">
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body text-center">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
            <h2 className="mt-3">Access Denied</h2>
            <p className="text-muted">You don't have permission to access this page.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      {isAuthenticated && <AppNavbar />}
      
      <main className={isAuthenticated ? "main-content" : ""}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Student routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/mood-history" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMoodHistory />
            </ProtectedRoute>
          } />
          <Route path="/student/recommendations" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentRecommendations />
            </ProtectedRoute>
          } />
          <Route path="/student/appointments" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAppointments />
            </ProtectedRoute>
          } />

          {/* Faculty routes */}
          <Route path="/faculty/dashboard" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />

          {/* Consultant routes */}
          <Route path="/consultant/dashboard" element={
            <ProtectedRoute allowedRoles={['consultant']}>
              <ConsultantDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
