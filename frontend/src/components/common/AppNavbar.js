import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../context/AuthContext';

const AppNavbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const renderRoleBasedNavigation = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <>
            <LinkContainer to="/admin/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Management" id="admin-nav-dropdown">
              <LinkContainer to="/admin/users">
                <NavDropdown.Item>User Management</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/admin/courses">
                <NavDropdown.Item>Course Management</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/admin/analytics">
                <NavDropdown.Item>System Analytics</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </>
        );

      case 'student':
        return (
          <>
            <LinkContainer to="/student/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/student/mood-history">
              <Nav.Link>Mood History</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/student/recommendations">
              <Nav.Link>Recommendations</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/student/appointments">
              <Nav.Link>Appointments</Nav.Link>
            </LinkContainer>
          </>
        );

      case 'faculty':
        return (
          <>
            <LinkContainer to="/faculty/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Students" id="faculty-nav-dropdown">
              <LinkContainer to="/faculty/students">
                <NavDropdown.Item>My Students</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/faculty/wellness-overview">
                <NavDropdown.Item>Wellness Overview</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/faculty/recommendations">
                <NavDropdown.Item>My Recommendations</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </>
        );

      case 'consultant':
        return (
          <>
            <LinkContainer to="/consultant/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <NavDropdown title="Appointments" id="consultant-nav-dropdown">
              <LinkContainer to="/consultant/schedule">
                <NavDropdown.Item>My Schedule</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/consultant/students">
                <NavDropdown.Item>My Students</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/consultant/analytics">
                <NavDropdown.Item>My Analytics</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
          </>
        );

      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'faculty': return 'primary';
      case 'consultant': return 'success';
      case 'student': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <strong>SWMS</strong>
            <small className="ms-2 text-muted">Student Wellness Management System</small>
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {renderRoleBasedNavigation()}
          </Nav>
          
          <Nav>
            <NavDropdown 
              title={
                <span>
                  {user?.first_name} {user?.last_name}
                  <Badge 
                    variant={getRoleBadgeVariant(user?.role)} 
                    className="ms-2"
                  >
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Badge>
                </span>
              } 
              id="user-nav-dropdown"
              align="end"
            >
              <NavDropdown.Item disabled>
                <small className="text-muted">
                  {user?.email}
                </small>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <LinkContainer to="/profile">
                <NavDropdown.Item>Profile Settings</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/help">
                <NavDropdown.Item>Help & Support</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
