import React from 'react';
import { Navbar as BSNavbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getNavItems = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return (
          <>
            <LinkContainer to="/admin/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/admin/add-faculty">
              <Nav.Link>Add Faculty</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/admin/add-consultant">
              <Nav.Link>Add Consultant</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/admin/users">
              <Nav.Link>User Management</Nav.Link>
            </LinkContainer>
          </>
        );
      
      case 'student':
        return (
          <>
            <LinkContainer to="/student/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/student/mood-entry">
              <Nav.Link>Mood Entry</Nav.Link>
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
            <LinkContainer to="/faculty/section-mood">
              <Nav.Link>Section Mood</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/faculty/vulnerable-students">
              <Nav.Link>Vulnerable Students</Nav.Link>
            </LinkContainer>
          </>
        );
      
      case 'consultant':
        return (
          <>
            <LinkContainer to="/consultant/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/consultant/recommendations">
              <Nav.Link>Recommendations</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/consultant/appointments">
              <Nav.Link>Appointments</Nav.Link>
            </LinkContainer>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BSNavbar.Brand href="/">
          <i className="fas fa-heart me-2"></i>
          SWMS
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {getNavItems()}
          </Nav>
          
          <Nav>
            <NavDropdown title={
              <span>
                <i className="fas fa-user-circle me-1"></i>
                {user?.name}
              </span>
            } id="user-dropdown">
              <NavDropdown.Item>
                <i className="fas fa-user me-2"></i>
                Profile
              </NavDropdown.Item>
              <NavDropdown.Item>
                <i className="fas fa-cog me-2"></i>
                Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
