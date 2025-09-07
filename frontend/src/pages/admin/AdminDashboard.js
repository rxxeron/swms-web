import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Tabs, Tab, Dropdown } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AppointmentForm from '../../components/forms/AppointmentForm';
import DeactivationModal from '../../components/modals/DeactivationModal';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0); // Filtered count
  const [totalUsersInDatabase, setTotalUsersInDatabase] = useState(0); // Always total count
  const [lastUpdated, setLastUpdated] = useState(null);
  const usersPerPage = 20;

  // System analytics (unaffected by filtering)
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByRole: {
      student: 0,
      faculty: 0,
      consultant: 0,
      admin: 0
    }
  });

  // Filtering and search state
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAllUsers, setViewAllUsers] = useState(false);

  // Course management state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: '',
    section: '',
    faculty_id: '',
    description: ''
  });

  // Appointment management state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [consultantList, setConsultantList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    statusStats: [],
    consultantStats: [],
    dailyStats: []
  });

  // User deactivation modal state
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    password: '',
    phoneNumber: '',
    number_of_courses: 3,
    courses: [
      { title: '', section: '' },
      { title: '', section: '' },
      { title: '', section: '' }
    ],
    student_id: ''
  });

  // Validation state for user form
  const [userValidation, setUserValidation] = useState({
    username: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
    firstName: { isValid: true, message: '' },
    lastName: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
    phoneNumber: { isValid: true, message: '' },
    number_of_courses: { isValid: true, message: '' },
    student_id: { isValid: true, message: '' },
    courses: []
  });

  // Validation state for course form
  const [courseValidation, setCourseValidation] = useState({
    title: { isValid: true, message: '' },
    section: { isValid: true, message: '' },
    description: { isValid: true, message: '' }
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedRole, viewAllUsers]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Validation functions
  const validateUsername = (username) => {
    if (!username || username.trim().length === 0) {
      return { isValid: false, message: 'Username is required' };
    }
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }
    if (username.length > 50) {
      return { isValid: false, message: 'Username must not exceed 50 characters' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, underscore, dot, and dash' };
    }
    return { isValid: true, message: '' };
  };

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    if (email.length > 100) {
      return { isValid: false, message: 'Email must not exceed 100 characters' };
    }
    return { isValid: true, message: '' };
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    if (name.length < 2) {
      return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
    }
    if (name.length > 50) {
      return { isValid: false, message: `${fieldName} must not exceed 50 characters` };
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return { isValid: false, message: `${fieldName} can only contain letters, spaces, apostrophes, and hyphens` };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password) => {
    if (!password || password.length === 0) {
      return { isValid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { isValid: false, message: 'Password must not exceed 128 characters' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }
    return { isValid: true, message: '' };
  };

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return { isValid: true, message: '' }; // Phone number is optional
    }
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
    return { isValid: true, message: '' };
  };

  const validateStudentId = (studentId) => {
    if (!studentId || studentId.trim().length === 0) {
      return { isValid: false, message: 'Student ID is required' };
    }
    if (studentId.length < 3) {
      return { isValid: false, message: 'Student ID must be at least 3 characters long' };
    }
    if (studentId.length > 20) {
      return { isValid: false, message: 'Student ID must not exceed 20 characters' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(studentId)) {
      return { isValid: false, message: 'Student ID can only contain letters and numbers' };
    }
    return { isValid: true, message: '' };
  };

  const validateCourseTitle = (title) => {
    if (!title || title.trim().length === 0) {
      return { isValid: false, message: 'Course title is required' };
    }
    if (title.length > 100) {
      return { isValid: false, message: 'Course title must not exceed 100 characters' };
    }
    // Format: Department Code + Space + Course Number (e.g., "CSE 103", "ICE 103")
    const coursePattern = /^[A-Z]{2,4}\s+\d{3}$/;
    if (!coursePattern.test(title.trim())) {
      return { isValid: false, message: 'Course title must be in format: "CSE 103" or "ICE 103" (Department Code + Space + 3-digit number)' };
    }
    return { isValid: true, message: '' };
  };

  const validateCourseSection = (section) => {
    if (!section || section.trim().length === 0) {
      return { isValid: false, message: 'Course section is required' };
    }
    // Section should be only numbers
    const sectionNumber = parseInt(section);
    if (isNaN(sectionNumber) || !Number.isInteger(sectionNumber)) {
      return { isValid: false, message: 'Course section must be a number only (e.g., 1, 2, 3)' };
    }
    if (sectionNumber < 1 || sectionNumber > 999) {
      return { isValid: false, message: 'Course section must be between 1 and 999' };
    }
    return { isValid: true, message: '' };
  };

  const validateNumberOfCourses = (count, role) => {
    // Consultants don't need course validation
    if (role === 'consultant') {
      return { isValid: true, message: '' };
    }
    
    const numCount = parseInt(count);
    if (isNaN(numCount)) {
      return { isValid: false, message: 'Number of courses must be a valid number' };
    }
    if (role === 'student') {
      if (numCount < 3) {
        return { isValid: false, message: 'Students must have at least 3 courses' };
      }
      if (numCount > 10) {
        return { isValid: false, message: 'Students cannot have more than 10 courses' };
      }
    } else if (role === 'faculty') {
      if (numCount < 1) {
        return { isValid: false, message: 'Faculty must teach at least 1 course' };
      }
      if (numCount > 10) {
        return { isValid: false, message: 'Faculty cannot teach more than 10 courses' };
      }
    }
    return { isValid: true, message: '' };
  };

  // Real-time validation handlers
  const handleUserFieldChange = (field, value) => {
    // Update the user data
    setNewUser(prev => ({ ...prev, [field]: value }));

    // Validate the field
    let validation;
    switch (field) {
      case 'username':
        validation = validateUsername(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'firstName':
        validation = validateName(value, 'First name');
        break;
      case 'lastName':
        validation = validateName(value, 'Last name');
        break;
      case 'password':
        validation = validatePassword(value);
        break;
      case 'phoneNumber':
        validation = validatePhoneNumber(value);
        break;
      case 'student_id':
        validation = validateStudentId(value);
        break;
      case 'number_of_courses':
        validation = validateNumberOfCourses(value, newUser.role);
        break;
      default:
        validation = { isValid: true, message: '' };
    }

    // Update validation state
    setUserValidation(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  const handleCourseFieldChange = (field, value) => {
    // Update the course data
    setNewCourse(prev => ({ ...prev, [field]: value }));

    // Validate the field
    let validation;
    switch (field) {
      case 'title':
        validation = validateCourseTitle(value);
        break;
      case 'section':
        validation = validateCourseSection(value);
        break;
      case 'description':
        if (value.length > 500) {
          validation = { isValid: false, message: 'Description must not exceed 500 characters' };
        } else {
          validation = { isValid: true, message: '' };
        }
        break;
      default:
        validation = { isValid: true, message: '' };
    }

    // Update validation state
    setCourseValidation(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...newUser.courses];
    updatedCourses[index][field] = value;
    setNewUser({ ...newUser, courses: updatedCourses });

    // Validate course field
    let validation;
    if (field === 'title') {
      validation = validateCourseTitle(value);
    } else if (field === 'section') {
      validation = validateCourseSection(value);
    } else {
      validation = { isValid: true, message: '' };
    }

    // Update course validation array
    setUserValidation(prev => {
      const newCourseValidations = [...(prev.courses || [])];
      if (!newCourseValidations[index]) {
        newCourseValidations[index] = { title: { isValid: true, message: '' }, section: { isValid: true, message: '' } };
      }
      newCourseValidations[index][field] = validation;
      return {
        ...prev,
        courses: newCourseValidations
      };
    });
  };

  const validateAllUserFields = () => {
    const validations = {
      username: validateUsername(newUser.username),
      email: validateEmail(newUser.email),
      firstName: validateName(newUser.firstName, 'First name'),
      lastName: validateName(newUser.lastName, 'Last name'),
      password: validatePassword(newUser.password),
      phoneNumber: validatePhoneNumber(newUser.phoneNumber),
      number_of_courses: validateNumberOfCourses(newUser.number_of_courses, newUser.role),
      courses: []
    };

    if (newUser.role === 'student') {
      validations.student_id = validateStudentId(newUser.student_id);
    }

    if (newUser.role === 'student' || newUser.role === 'faculty') {
      validations.courses = newUser.courses.map(course => ({
        title: validateCourseTitle(course.title),
        section: validateCourseSection(course.section)
      }));
    }

    setUserValidation(validations);

    // Check if all validations pass
    const isValid = Object.values(validations).every(validation => {
      if (Array.isArray(validation)) {
        return validation.every(courseValidation => 
          Object.values(courseValidation).every(fieldValidation => fieldValidation.isValid)
        );
      }
      return validation.isValid;
    });

    return isValid;
  };

  const validateAllCourseFields = () => {
    const validations = {
      title: validateCourseTitle(newCourse.title),
      section: validateCourseSection(newCourse.section),
      description: newCourse.description.length > 500 
        ? { isValid: false, message: 'Description must not exceed 500 characters' }
        : { isValid: true, message: '' }
    };

    setCourseValidation(validations);

    return Object.values(validations).every(validation => validation.isValid);
  };

  // Modal handlers
  const handleOpenUserModal = () => {
    setShowUserModal(true);
    setError('');
    // Reset validation state when opening modal
    setUserValidation({
      username: { isValid: true, message: '' },
      email: { isValid: true, message: '' },
      firstName: { isValid: true, message: '' },
      lastName: { isValid: true, message: '' },
      password: { isValid: true, message: '' },
      phoneNumber: { isValid: true, message: '' },
      number_of_courses: { isValid: true, message: '' },
      student_id: { isValid: true, message: '' },
      courses: []
    });
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setError('');
    setNewUser({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
      password: '',
      phoneNumber: '',
      number_of_courses: 3,
      courses: [
        { title: '', section: '' },
        { title: '', section: '' },
        { title: '', section: '' }
      ],
      student_id: ''
    });
    setUserValidation({
      username: { isValid: true, message: '' },
      email: { isValid: true, message: '' },
      firstName: { isValid: true, message: '' },
      lastName: { isValid: true, message: '' },
      password: { isValid: true, message: '' },
      phoneNumber: { isValid: true, message: '' },
      number_of_courses: { isValid: true, message: '' },
      student_id: { isValid: true, message: '' },
      courses: []
    });
  };

  const handleOpenCourseModal = () => {
    setShowCourseModal(true);
    setError('');
    setCourseValidation({
      title: { isValid: true, message: '' },
      section: { isValid: true, message: '' },
      description: { isValid: true, message: '' }
    });
  };

  const handleCloseCourseModal = () => {
    setShowCourseModal(false);
    setError('');
    setNewCourse({ title: '', section: '', faculty_id: '', description: '' });
    setSelectedCourse(null);
    setCourseValidation({
      title: { isValid: true, message: '' },
      section: { isValid: true, message: '' },
      description: { isValid: true, message: '' }
    });
  };

  const fetchData = async (page = currentPage) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', viewAllUsers ? '1000' : usersPerPage);
      
      if (selectedRole !== 'all') {
        params.append('role', selectedRole);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const [usersRes, statsRes, coursesRes, appointmentsRes, appointmentStatsRes] = await Promise.all([
        api.get(`/admin/users?${params.toString()}`),
        api.get('/admin/stats'),
        api.get('/admin/courses'),
        api.get('/admin/appointments'),
        api.get('/admin/appointments/stats')
      ]);

      setUsers(usersRes.data.data.users || []);
      setTotalPages(usersRes.data.data.pagination?.totalPages || 1);
      setTotalUsers(usersRes.data.data.pagination?.totalItems || 0);
      setCourses(coursesRes.data.data.courses || []);
      setAppointments(appointmentsRes.data.data.appointments || []);
      setAppointmentStats(appointmentStatsRes.data.data || null);
      
      // For dropdowns, we need all users regardless of pagination
      const allUsersRes = await api.get('/admin/users?limit=1000');
      const allUsers = allUsersRes.data.data.users || [];
      
      // Set total users in database (overall count, not filtered)
      setTotalUsersInDatabase(allUsersRes.data.data.pagination?.totalItems || 0);
      
      // Calculate system statistics (unaffected by filtering)
      const activeUsers = allUsers.filter(user => user.is_active).length;
      const inactiveUsers = allUsers.filter(user => !user.is_active).length;
      const usersByRole = {
        student: allUsers.filter(user => user.role === 'student').length,
        faculty: allUsers.filter(user => user.role === 'faculty').length,
        consultant: allUsers.filter(user => user.role === 'consultant').length,
        admin: allUsers.filter(user => user.role === 'admin').length
      };
      
      setSystemStats({
        totalUsers: allUsers.length,
        activeUsers,
        inactiveUsers,
        usersByRole
      });
      
      // Filter faculty for dropdown
      const faculty = allUsers.filter(user => user.role === 'faculty');
      setFacultyList(faculty);
      
      // Filter consultants and students for appointments
      const consultants = allUsers.filter(user => user.role === 'consultant');
      const students = allUsers.filter(user => user.role === 'student');
      setConsultantList(consultants);
      setStudentList(students);
      
      // Extract data from stats response
      const stats = statsRes.data.data;
      setAppointments(stats.appointmentStats || []);
      setMoodData(stats.moodStats || {});
      
      // Update last refreshed timestamp
      setLastUpdated(new Date());
      
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserLists = async () => {
    try {
      const allUsersRes = await api.get('/admin/users?limit=1000');
      const allUsers = allUsersRes.data.data.users || [];
      
      const faculty = allUsers.filter(user => user.role === 'faculty');
      const consultants = allUsers.filter(user => user.role === 'consultant');
      const students = allUsers.filter(user => user.role === 'student');
      
      setFacultyList(faculty);
      setConsultantList(consultants);
      setStudentList(students);
    } catch (error) {
      console.error('Error refreshing user lists:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateAllUserFields()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    try {
      const userData = {
        name: `${newUser.firstName} ${newUser.lastName}`,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password
      };

      let endpoint;
      if (newUser.role === 'faculty') {
        endpoint = '/admin/faculty';
        userData.number_of_courses = newUser.number_of_courses;
        userData.courses = newUser.courses;
      } else if (newUser.role === 'consultant') {
        endpoint = '/admin/consultant';
      } else if (newUser.role === 'student') {
        endpoint = '/auth/register';
        userData.student_id = newUser.student_id;
        userData.role = 'student';
        userData.number_of_courses = newUser.number_of_courses;
        userData.courses = newUser.courses;
      } else {
        throw new Error('Admin creation not supported through this interface');
      }

      await api.post(endpoint, userData);
      
      // Show success message
      setError(''); // Clear any previous errors
      
      setShowUserModal(false);
      setNewUser({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'student',
        password: '',
        phoneNumber: '',
        number_of_courses: 3,
        courses: [
          { title: '', section: '' },
          { title: '', section: '' },
          { title: '', section: '' }
        ],
        student_id: ''
      });
      // Reset validation state
      setUserValidation({
        username: { isValid: true, message: '' },
        email: { isValid: true, message: '' },
        firstName: { isValid: true, message: '' },
        lastName: { isValid: true, message: '' },
        password: { isValid: true, message: '' },
        phoneNumber: { isValid: true, message: '' },
        number_of_courses: { isValid: true, message: '' },
        student_id: { isValid: true, message: '' },
        courses: []
      });
      
      fetchData(1); // Reset to first page after creating user
      setCurrentPage(1);
      refreshUserLists(); // Update dropdown lists
      
      // Show success alert temporarily
      alert(`User created successfully!`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
      console.error('Error creating user:', error);
    }
  };

  // Filter and search handlers
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewAllToggle = () => {
    setViewAllUsers(!viewAllUsers);
    setCurrentPage(1); // Reset to first page when toggling view
  };

  const clearFilters = () => {
    setSelectedRole('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination functions
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    return items;
  };

  const handleTemporaryDeactivate = (user) => {
    setUserToDeactivate(user);
    setShowDeactivationModal(true);
  };

  const handlePermanentDeactivate = (user) => {
    const foundUser = users.find(u => u.id === user);
    setUserToDeactivate(foundUser);
    setShowDeactivationModal(true);
  };

  const handleDeactivationSubmit = async (deactivationData) => {
    try {
      const { action, deactivate_until, user } = deactivationData;
      const payload = { 
        action,
        deactivate_until: deactivate_until || null
      };
      
      const response = await api.put(`/admin/users/${user.id}/status`, payload);
      if (response.data.success) {
        let message = '';
        switch (action) {
          case 'temporary':
            message = `${user.first_name} ${user.last_name} temporarily deactivated until ${new Date(deactivate_until).toLocaleString()}`;
            break;
          case 'permanent':
            message = `${user.first_name} ${user.last_name} permanently deactivated`;
            break;
        }
        alert(message);
        setShowDeactivationModal(false);
        setUserToDeactivate(null);
        fetchData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user status');
      console.error('Error updating user status:', error);
    }
  };

  const handleLiftDeactivationEarly = (userId) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Lift deactivation early for ${user.first_name} ${user.last_name}?`)) {
      performUserDeactivation(userId, 'reactivate');
    }
  };

  const handleReactivateUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Reactivate ${user.first_name} ${user.last_name}?`)) {
      performUserDeactivation(userId, 'reactivate');
    }
  };

  const handlePermanentDelete = (userId) => {
    const user = users.find(u => u.id === userId);
    const confirmText = `DELETE ${user.username}`;
    const userInput = prompt(
      `⚠️ PERMANENT DELETION WARNING ⚠️\n\n` +
      `This will PERMANENTLY DELETE ${user.first_name} ${user.last_name} (${user.username}) from the system.\n` +
      `This action CANNOT be undone and will remove:\n` +
      `• User account and profile\n` +
      `• All associated data\n` +
      `• All course enrollments\n` +
      `• All appointment history\n\n` +
      `Type "${confirmText}" to confirm permanent deletion:`
    );
    
    if (userInput === confirmText) {
      performUserDeletion(userId);
    } else if (userInput !== null) {
      alert('Deletion cancelled. Text did not match.');
    }
  };

  const performUserDeactivation = async (userId, type, deactivateUntil = null) => {
    try {
      const payload = { 
        action: type,
        deactivate_until: deactivateUntil 
      };
      
      const response = await api.put(`/admin/users/${userId}/status`, payload);
      if (response.data.success) {
        const user = users.find(u => u.id === userId);
        let message = '';
        switch (type) {
          case 'temporary':
            message = `${user.first_name} ${user.last_name} temporarily deactivated until ${new Date(deactivateUntil).toLocaleString()}`;
            break;
          case 'permanent':
            message = `${user.first_name} ${user.last_name} permanently deactivated`;
            break;
          case 'reactivate':
            message = `${user.first_name} ${user.last_name} reactivated successfully`;
            break;
        }
        alert(message);
        fetchData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user status');
      console.error('Error updating user status:', error);
    }
  };

  const performUserDeletion = async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}?permanent=true`);
      if (response.data.success) {
        alert('User permanently deleted from the system');
        fetchData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    // Legacy function - keeping for compatibility
    handlePermanentDeactivate(userId);
  };

  // Course Management Functions
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    // Validate all course fields before submission
    if (!validateAllCourseFields()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    try {
      const courseData = {
        title: newCourse.title,
        section: newCourse.section,
        faculty_id: newCourse.faculty_id || null,
        description: newCourse.description
      };

      await api.post('/admin/courses', courseData);
      setShowCourseModal(false);
      setNewCourse({ title: '', section: '', faculty_id: '', description: '' });
      // Reset course validation state
      setCourseValidation({
        title: { isValid: true, message: '' },
        section: { isValid: true, message: '' },
        description: { isValid: true, message: '' }
      });
      setSelectedCourse(null);
      setError(''); // Clear any previous errors
      fetchData();
      alert('Course created successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
      console.error('Error creating course:', error);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    
    // Validate all course fields before submission
    if (!validateAllCourseFields()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    try {
      const courseData = {
        title: newCourse.title,
        section: newCourse.section,
        faculty_id: newCourse.faculty_id || null,
        description: newCourse.description
      };

      await api.put(`/admin/courses/${selectedCourse.id}`, courseData);
      setShowCourseModal(false);
      setNewCourse({ title: '', section: '', faculty_id: '', description: '' });
      // Reset course validation state
      setCourseValidation({
        title: { isValid: true, message: '' },
        section: { isValid: true, message: '' },
        description: { isValid: true, message: '' }
      });
      setSelectedCourse(null);
      setError(''); // Clear any previous errors
      fetchData();
      alert('Course updated successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update course');
      console.error('Error updating course:', error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? All student enrollments will be removed.')) {
      try {
        await api.delete(`/admin/courses/${courseId}`);
        fetchData();
        alert('Course deleted successfully');
      } catch (error) {
        setError('Failed to delete course');
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleViewStudents = async (course) => {
    try {
      const response = await api.get(`/admin/courses/${course.id}/students`);
      setCourseStudents(response.data.data.students || []);
      setSelectedCourse(course);
      setShowStudentModal(true);
    } catch (error) {
      setError('Failed to fetch course students');
      console.error('Error fetching students:', error);
    }
  };

  const openCourseModal = (course = null) => {
    if (course) {
      setSelectedCourse(course);
      setNewCourse({
        title: course.title,
        section: course.section,
        faculty_id: course.faculty_id || '',
        description: course.description || ''
      });
    } else {
      setSelectedCourse(null);
      setNewCourse({ title: '', section: '', faculty_id: '', description: '' });
    }
    setError('');
    setCourseValidation({
      title: { isValid: true, message: '' },
      section: { isValid: true, message: '' },
      description: { isValid: true, message: '' }
    });
    setShowCourseModal(true);
  };

  // Appointment Management Functions
  const handleCreateAppointment = async (appointmentData) => {
    try {
      await api.post('/admin/appointments', appointmentData);
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
      fetchData();
      alert('Appointment created successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create appointment');
      console.error('Error creating appointment:', error);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, statusData) => {
    try {
      await api.put(`/admin/appointments/${appointmentId}/status`, statusData);
      fetchData();
      alert('Appointment status updated successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update appointment status');
      console.error('Error updating appointment status:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await api.delete(`/admin/appointments/${appointmentId}`);
        fetchData();
        alert('Appointment deleted successfully');
      } catch (error) {
        setError('Failed to delete appointment');
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const openAppointmentModal = (appointment = null) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'confirmed': return 'bg-info';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-secondary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (appointmentFilter === 'all') return true;
    return appointment.status === appointmentFilter;
  });

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'faculty': return 'primary';
      case 'consultant': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading admin dashboard...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Admin Dashboard</h2>
          <p className="text-muted">Manage users, courses, and system analytics</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Total Users</Card.Title>
              <h3 className="text-primary">{systemStats.totalUsers}</h3>
              <small className="text-muted">
                {systemStats.activeUsers} active, {systemStats.inactiveUsers} inactive
                {lastUpdated && (
                  <><br />Updated: {lastUpdated.toLocaleTimeString()}</>
                )}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Active Courses</Card.Title>
              <h3 className="text-success">{courses.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Total Appointments</Card.Title>
              <h3 className="text-info">{appointments.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Avg Mood</Card.Title>
              <h3 className="text-warning">
                {moodData.overall_avg_mood ? Number(moodData.overall_avg_mood).toFixed(1) : 'N/A'}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Activity Analytics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>User Activity Status</Card.Title>
              <Row>
                <Col md={6}>
                  <div className="text-center">
                    <h4 className="text-success">{systemStats.activeUsers}</h4>
                    <small className="text-muted">Active Users</small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <h4 className="text-danger">{systemStats.inactiveUsers}</h4>
                    <small className="text-muted">Inactive Users</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>User Role Distribution</Card.Title>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-success">{systemStats.usersByRole.student}</h6>
                    <small className="text-muted">Students</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-info">{systemStats.usersByRole.faculty}</h6>
                    <small className="text-muted">Faculty</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-warning">{systemStats.usersByRole.consultant}</h6>
                    <small className="text-muted">Consultants</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-danger">{systemStats.usersByRole.admin}</h6>
                    <small className="text-muted">Admins</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different sections */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="users" title="User Management">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Users</h5>
              <Button variant="primary" onClick={handleOpenUserModal}>
                Create New User
              </Button>
            </Card.Header>
            <Card.Body>
              {/* Filter and Search Controls */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter by Role</Form.Label>
                    <Form.Select 
                      value={selectedRole} 
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="consultant">Consultant</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search Users</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, username, email, or student ID..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Check
                        type="switch"
                        id="view-all-switch"
                        label="View All Users"
                        checked={viewAllUsers}
                        onChange={handleViewAllToggle}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>&nbsp;</Form.Label>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={clearFilters}
                        className="w-100"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Results Summary */}
              <Row className="mb-3">
                <Col>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {selectedRole !== 'all' || searchTerm ? (
                        <>
                          Showing {totalUsers} user{totalUsers !== 1 ? 's' : ''} 
                          {selectedRole !== 'all' && ` with role "${selectedRole}"`}
                          {searchTerm && ` matching "${searchTerm}"`}
                          <span className="text-info"> (of {systemStats.totalUsers} total)</span>
                        </>
                      ) : (
                        `Total ${totalUsers} user${totalUsers !== 1 ? 's' : ''} in database`
                      )}
                    </small>
                    {(selectedRole !== 'all' || searchTerm) && (
                      <Badge bg="info">
                        Filtered Results
                      </Badge>
                    )}
                  </div>
                </Col>
              </Row>

              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        {user.is_active ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <div>
                            <Badge bg="danger">Inactive</Badge>
                            {user.deactivated_until && (
                              <div className="small text-muted mt-1">
                                <i className="fas fa-clock me-1"></i>
                                Until: {new Date(user.deactivated_until).toLocaleString()}
                                {new Date(user.deactivated_until) > new Date() && (
                                  <div className="text-warning">
                                    <small>
                                      <i className="fas fa-hourglass-half me-1"></i>
                                      {Math.ceil((new Date(user.deactivated_until) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                                    </small>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {user.role !== 'admin' ? (
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant="outline-secondary" 
                              size="sm"
                              id={`dropdown-${user.id}`}
                            >
                              Manage
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {user.is_active ? (
                                <>
                                  <Dropdown.Item 
                                    onClick={() => handleTemporaryDeactivate(user)}
                                  >
                                    <i className="fas fa-pause text-warning me-2"></i>
                                    Temporary Deactivate
                                  </Dropdown.Item>
                                  <Dropdown.Item 
                                    onClick={() => handlePermanentDeactivate(user.id)}
                                  >
                                    <i className="fas fa-ban text-danger me-2"></i>
                                    Permanent Deactivate
                                  </Dropdown.Item>
                                </>
                              ) : (
                                <>
                                  <Dropdown.Item 
                                    onClick={() => handleReactivateUser(user.id)}
                                  >
                                    <i className="fas fa-play text-success me-2"></i>
                                    Reactivate User
                                  </Dropdown.Item>
                                  {user.deactivated_until && (
                                    <Dropdown.Item 
                                      onClick={() => handleLiftDeactivationEarly(user.id)}
                                    >
                                      <i className="fas fa-clock text-info me-2"></i>
                                      Lift Deactivation Early
                                    </Dropdown.Item>
                                  )}
                                </>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handlePermanentDelete(user.id)}
                                className="text-danger"
                              >
                                <i className="fas fa-trash me-2"></i>
                                Permanent Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        ) : (
                          <Badge variant="info">Protected</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Pagination Controls */}
              {!viewAllUsers && totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center">
                    <span className="text-muted">
                      Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} 
                      {selectedRole !== 'all' ? ` filtered users (${systemStats.totalUsers} total in database)` : ' users'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="me-2"
                    >
                      Previous
                    </Button>
                    {getPaginationItems().map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="me-1"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ms-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="courses" title="Course Management">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Courses</h5>
              <Button variant="primary" onClick={() => openCourseModal()}>
                Add New Course
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Section</th>
                    <th>Faculty</th>
                    <th>Enrolled Students</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.title}</td>
                      <td>
                        <Badge variant="secondary">{course.section}</Badge>
                      </td>
                      <td>{course.faculty_name || <span className="text-muted">Unassigned</span>}</td>
                      <td>
                        <Badge variant="info">{course.enrolled_students || 0}</Badge>
                      </td>
                      <td>{new Date(course.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => openCourseModal(course)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewStudents(course)}
                        >
                          Students
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No courses found. Click "Add New Course" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="appointments" title="Appointment Overview">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Appointment Management</h5>
              <div className="d-flex gap-2">
                <Form.Select 
                  size="sm" 
                  style={{ width: '150px' }}
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => openAppointmentModal()}
                >
                  <i className="fas fa-plus me-1"></i>
                  Create Appointment
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {appointmentStats && (
                <Row className="mb-3">
                  <Col>
                    <div className="d-flex flex-wrap gap-3">
                      {appointmentStats.statusStats?.map((stat) => (
                        <div key={stat.status} className="text-center">
                          <Badge bg={getStatusBadgeClass(stat.status).replace('bg-', '')} className="d-block mb-1">
                            {stat.status.toUpperCase()}
                          </Badge>
                          <small>{stat.count}</small>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}
              
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No appointments found</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Consultant</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Requested By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>
                          <div>
                            <strong>{appointment.student_name}</strong>
                            <br />
                            <small className="text-muted">{appointment.student_email}</small>
                            {appointment.student_id && (
                              <><br /><small className="text-muted">ID: {appointment.student_id}</small></>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{appointment.consultant_name}</strong>
                            <br />
                            <small className="text-muted">{appointment.consultant_email}</small>
                          </div>
                        </td>
                        <td>{formatDate(appointment.appointment_date)}</td>
                        <td>{formatTime(appointment.appointment_time)}</td>
                        <td>
                          <Badge bg={getStatusBadgeClass(appointment.status).replace('bg-', '')}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant="outline-secondary">
                            {appointment.requested_by}
                          </Badge>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant="outline-secondary" 
                              size="sm"
                              id={`dropdown-${appointment.id}`}
                            >
                              Actions
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item 
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, { status: 'confirmed' })}
                                disabled={appointment.status === 'confirmed'}
                              >
                                <i className="fas fa-check text-success me-2"></i>
                                Confirm
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, { status: 'completed' })}
                                disabled={appointment.status === 'completed'}
                              >
                                <i className="fas fa-check-double text-primary me-2"></i>
                                Mark Complete
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, { status: 'cancelled' })}
                                disabled={appointment.status === 'cancelled'}
                              >
                                <i className="fas fa-ban text-warning me-2"></i>
                                Cancel
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="text-danger"
                              >
                                <i className="fas fa-trash me-2"></i>
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="analytics" title="System Analytics">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Mood Trends</h5>
                </Card.Header>
                <Card.Body>
                  <p>Average Mood: {moodData.overall_avg_mood ? Number(moodData.overall_avg_mood).toFixed(1) : 'N/A'}</p>
                  <p>Total Entries: {moodData.total_entries || 0}</p>
                  <p>This Week: {moodData.entries_this_week || 0}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Create User Modal */}
      <Modal show={showUserModal} onHide={handleCloseUserModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={newUser.username}
                    onChange={(e) => handleUserFieldChange('username', e.target.value)}
                    isInvalid={!userValidation.username.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.username.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleUserFieldChange('email', e.target.value)}
                    isInvalid={!userValidation.email.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.email.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => handleUserFieldChange('firstName', e.target.value)}
                    isInvalid={!userValidation.firstName.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.firstName.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => handleUserFieldChange('lastName', e.target.value)}
                    isInvalid={!userValidation.lastName.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.lastName.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={newUser.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      const courseCount = role === 'student' ? 3 : 1;
                      const courses = Array(courseCount).fill().map(() => ({ title: '', section: '' }));
                      setNewUser({
                        ...newUser, 
                        role,
                        number_of_courses: courseCount,
                        courses: role === 'faculty' || role === 'student' ? courses : []
                      });
                    }}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="consultant">Consultant</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={newUser.phoneNumber}
                    onChange={(e) => handleUserFieldChange('phoneNumber', e.target.value)}
                    isInvalid={!userValidation.phoneNumber.isValid}
                    placeholder="e.g., +1234567890"
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.phoneNumber.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Optional - Enter your phone number with country code
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newUser.password}
                onChange={(e) => handleUserFieldChange('password', e.target.value)}
                isInvalid={!userValidation.password.isValid}
                required
                minLength={8}
              />
              <Form.Control.Feedback type="invalid">
                {userValidation.password.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </Form.Text>
            </Form.Group>

            {/* Faculty/Student Course Fields */}
            {(newUser.role === 'faculty' || newUser.role === 'student') && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Courses</Form.Label>
                  <Form.Control
                    type="number"
                    min={newUser.role === 'student' ? 3 : 1}
                    max={10}
                    value={newUser.number_of_courses || ''}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      const courses = Array(count).fill().map((_, i) => 
                        newUser.courses?.[i] || { title: '', section: '' }
                      );
                      setNewUser({...newUser, number_of_courses: count, courses});
                      handleUserFieldChange('number_of_courses', count);
                    }}
                    isInvalid={!userValidation.number_of_courses.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {userValidation.number_of_courses.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {newUser.role === 'student' ? 'Students require at least 3 courses' : 'Faculty can teach 1-10 courses'}
                  </Form.Text>
                </Form.Group>

                {newUser.courses && newUser.courses.map((course, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Course {index + 1} Title</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., CSE 103, ICE 103"
                          value={course.title}
                          onChange={(e) => handleCourseChange(index, 'title', e.target.value)}
                          isInvalid={userValidation.courses?.[index]?.title && !userValidation.courses[index].title.isValid}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {userValidation.courses?.[index]?.title?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Course {index + 1} Section</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="e.g., 1, 2, 3"
                          value={course.section}
                          onChange={(e) => handleCourseChange(index, 'section', e.target.value)}
                          isInvalid={userValidation.courses?.[index]?.section && !userValidation.courses[index].section.isValid}
                          min="1"
                          max="999"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {userValidation.courses?.[index]?.section?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                ))}
              </>
            )}

            {/* Student ID field for students */}
            {newUser.role === 'student' && (
              <Form.Group className="mb-3">
                <Form.Label>Student ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., STU001"
                  value={newUser.student_id || ''}
                  onChange={(e) => handleUserFieldChange('student_id', e.target.value)}
                  isInvalid={!userValidation.student_id.isValid}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {userValidation.student_id.message}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Unique identifier for the student (letters and numbers only)
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseUserModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Course Management Modal */}
      <Modal show={showCourseModal} onHide={handleCloseCourseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourse ? 'Edit Course' : 'Add New Course'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={selectedCourse ? handleEditCourse : handleCreateCourse}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., CSE 103, ICE 103"
                    value={newCourse.title}
                    onChange={(e) => handleCourseFieldChange('title', e.target.value)}
                    isInvalid={!courseValidation.title.isValid}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {courseValidation.title.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Format: Department Code + Space + Course Number (e.g., CSE 103)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 1, 2, 3"
                    value={newCourse.section}
                    onChange={(e) => handleCourseFieldChange('section', e.target.value)}
                    isInvalid={!courseValidation.section.isValid}
                    min="1"
                    max="999"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {courseValidation.section.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Section number (1-999)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Assign Faculty (Optional)</Form.Label>
              <Form.Select
                value={newCourse.faculty_id}
                onChange={(e) => setNewCourse({...newCourse, faculty_id: e.target.value})}
              >
                <option value="">Select Faculty Member</option>
                {facultyList.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name} ({faculty.username})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Course description..."
                value={newCourse.description}
                onChange={(e) => handleCourseFieldChange('description', e.target.value)}
                isInvalid={!courseValidation.description.isValid}
                maxLength={500}
              />
              <Form.Control.Feedback type="invalid">
                {courseValidation.description.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {newCourse.description.length}/500 characters
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseCourseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Course Students Modal */}
      <Modal show={showStudentModal} onHide={() => setShowStudentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Students Enrolled in {selectedCourse?.title} - {selectedCourse?.section}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {courseStudents.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {courseStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.student_id}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.email}</td>
                    <td>{new Date(student.enrolled_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              <h5>No students enrolled</h5>
              <p>No students are currently enrolled in this course.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Appointment Modal */}
      <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAppointment ? 'Edit Appointment' : 'Create New Appointment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppointmentForm
            appointment={selectedAppointment}
            consultantList={consultantList}
            studentList={studentList}
            onSubmit={handleCreateAppointment}
            onCancel={() => setShowAppointmentModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* User Deactivation Modal */}
      <DeactivationModal
        show={showDeactivationModal}
        onHide={() => {
          setShowDeactivationModal(false);
          setUserToDeactivate(null);
        }}
        user={userToDeactivate}
        onSubmit={handleDeactivationSubmit}
      />
    </Container>
  );
};

export default AdminDashboard;

// Enhanced admin dashboard with complete user management
