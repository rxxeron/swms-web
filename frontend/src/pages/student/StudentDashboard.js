import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todaysMood, setTodaysMood] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get today's mood entry
      const today = new Date().toISOString().split('T')[0];
      const moodResponse = await api.get(`/student/mood/${today}`);
      setTodaysMood(moodResponse.data.data.entry);
      
      // Get mood statistics
      const statsResponse = await api.get('/student/mood?period=30days');
      setStats(statsResponse.data.data.statistics);
      
    } catch (error) {
      if (error.response?.status !== 404) {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Welcome back, {user?.name}!</h1>
              <p className="text-muted">Student ID: {user?.student_id}</p>
            </div>
            <div>
              <span className="badge bg-primary fs-6">Student Dashboard</span>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Today's Mood Status */}
      <Row className="mb-4">
        <Col>
          <Card className="dashboard-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>Today's Mood Entry</h5>
                  {todaysMood ? (
                    <div>
                      <span className="badge bg-success me-2">Completed</span>
                      <span>Mood Level: {todaysMood.mood_level}/10</span>
                    </div>
                  ) : (
                    <div>
                      <span className="badge bg-warning text-dark me-2">Pending</span>
                      <span>You haven't recorded your mood today</span>
                    </div>
                  )}
                </div>
                <div>
                  {todaysMood ? (
                    <Link to="/student/mood-entry">
                      <Button variant="outline-primary">View Entry</Button>
                    </Link>
                  ) : (
                    <Link to="/student/mood-entry">
                      <Button variant="primary">
                        <i className="fas fa-plus me-2"></i>
                        Add Mood Entry
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <div className="stat-value">{stats.total_entries}</div>
                <div className="stat-label">Total Entries</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <div className="stat-value">
                  {stats.average_mood ? parseFloat(stats.average_mood).toFixed(1) : 'N/A'}
                </div>
                <div className="stat-label">Average Mood</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <div className="stat-value">{stats.high_mood_count}</div>
                <div className="stat-label">Good Days (7+)</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <div className="stat-value">{stats.low_mood_count}</div>
                <div className="stat-label">Difficult Days (&lt;4)</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Quick Actions */}
      <Row>
        <Col md={6}>
          <Card className="dashboard-card card-hover">
            <Card.Body className="text-center">
              <i className="fas fa-chart-line text-primary mb-3" style={{ fontSize: '3rem' }}></i>
              <Card.Title>Mood History</Card.Title>
              <Card.Text>
                View your mood trends and patterns over time with detailed charts and statistics.
              </Card.Text>
              <Link to="/student/mood-history">
                <Button variant="primary">View History</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="dashboard-card card-hover">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-check text-success mb-3" style={{ fontSize: '3rem' }}></i>
              <Card.Title>Appointments</Card.Title>
              <Card.Text>
                Manage your counseling appointments, book new sessions, and view upcoming meetings.
              </Card.Text>
              <Link to="/student/appointments">
                <Button variant="success">Manage Appointments</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="dashboard-card card-hover">
            <Card.Body className="text-center">
              <i className="fas fa-lightbulb text-warning mb-3" style={{ fontSize: '3rem' }}></i>
              <Card.Title>Recommendations</Card.Title>
              <Card.Text>
                View consultation recommendations from faculty members and auto-generated suggestions.
              </Card.Text>
              <Link to="/student/recommendations">
                <Button variant="warning">View Recommendations</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="dashboard-card card-hover">
            <Card.Body className="text-center">
              <i className="fas fa-smile text-info mb-3" style={{ fontSize: '3rem' }}></i>
              <Card.Title>Mood Entry</Card.Title>
              <Card.Text>
                Record how you're feeling today with our interactive mood tracking system.
              </Card.Text>
              <Link to="/student/mood-entry">
                <Button variant="info">Record Mood</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDashboard;
