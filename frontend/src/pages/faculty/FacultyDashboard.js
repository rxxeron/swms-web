import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const FacultyDashboard = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [moodAnalytics, setMoodAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  const [newRecommendation, setNewRecommendation] = useState({
    studentId: '',
    type: 'academic',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, recommendationsRes, coursesRes, moodRes] = await Promise.all([
        axios.get('/api/faculty/students', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/faculty/recommendations', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/faculty/courses', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/faculty/mood-analytics', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStudents(studentsRes.data);
      setRecommendations(recommendationsRes.data);
      setCourses(coursesRes.data);
      setMoodAnalytics(moodRes.data);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecommendation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/faculty/recommendations', newRecommendation, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Recommendation created successfully');
      setShowRecommendationModal(false);
      setNewRecommendation({
        studentId: '',
        type: 'academic',
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      setError('Failed to create recommendation');
      console.error('Error creating recommendation:', error);
    }
  };

  const openRecommendationModal = (student) => {
    setSelectedStudent(student);
    setNewRecommendation({
      ...newRecommendation,
      studentId: student.id
    });
    setShowRecommendationModal(true);
  };

  const getMoodColor = (mood) => {
    if (mood >= 8) return 'success';
    if (mood >= 6) return 'warning';
    if (mood >= 4) return 'info';
    return 'danger';
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'academic': return 'primary';
      case 'wellness': return 'success';
      case 'personal': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading faculty dashboard...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Faculty Dashboard</h2>
          <p className="text-muted">Monitor student wellness and provide recommendations</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>My Students</Card.Title>
              <h3 className="text-primary">{students.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>My Courses</Card.Title>
              <h3 className="text-success">{courses.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Recommendations</Card.Title>
              <h3 className="text-info">{recommendations.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Avg Student Mood</Card.Title>
              <h3 className={`text-${getMoodColor(moodAnalytics.averageMood)}`}>
                {moodAnalytics.averageMood ? moodAnalytics.averageMood.toFixed(1) : 'N/A'}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different sections */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="students" title="My Students">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Student Wellness Overview</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Recent Mood</th>
                    <th>Last Entry</th>
                    <th>Trend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.first_name} {student.last_name}</td>
                      <td>{student.email}</td>
                      <td>{student.course_name}</td>
                      <td>
                        <Badge variant={getMoodColor(student.recent_mood)}>
                          {student.recent_mood ? student.recent_mood.toFixed(1) : 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        {student.last_mood_entry ? 
                          new Date(student.last_mood_entry).toLocaleDateString() : 
                          'No entries'
                        }
                      </td>
                      <td>
                        {student.mood_trend === 'improving' && 
                          <Badge variant="success">↗ Improving</Badge>
                        }
                        {student.mood_trend === 'declining' && 
                          <Badge variant="danger">↘ Declining</Badge>
                        }
                        {student.mood_trend === 'stable' && 
                          <Badge variant="info">→ Stable</Badge>
                        }
                        {!student.mood_trend && 
                          <Badge variant="secondary">No data</Badge>
                        }
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openRecommendationModal(student)}
                        >
                          Recommend
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="recommendations" title="My Recommendations">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recommendations I've Made</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Student Response</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map(rec => (
                    <tr key={rec.id}>
                      <td>{rec.student_name}</td>
                      <td>{rec.title}</td>
                      <td>
                        <Badge variant={getTypeBadgeVariant(rec.type)}>
                          {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={rec.status === 'accepted' ? 'success' : 
                                       rec.status === 'declined' ? 'danger' : 'warning'}>
                          {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </Badge>
                      </td>
                      <td>{new Date(rec.created_at).toLocaleDateString()}</td>
                      <td>{rec.student_feedback || 'No response yet'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="courses" title="My Courses">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Courses I Teach</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Credits</th>
                    <th>Enrolled Students</th>
                    <th>Avg Mood</th>
                    <th>Wellness Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.course_code}</td>
                      <td>{course.course_name}</td>
                      <td>{course.credits}</td>
                      <td>{course.enrolled_count}</td>
                      <td>
                        <Badge variant={getMoodColor(course.avg_mood)}>
                          {course.avg_mood ? course.avg_mood.toFixed(1) : 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        {course.low_mood_students > 0 ? (
                          <Badge variant="danger">
                            {course.low_mood_students} students need attention
                          </Badge>
                        ) : (
                          <Badge variant="success">All good</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="analytics" title="Wellness Analytics">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Mood Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <strong>High Mood (8-10):</strong> {moodAnalytics.highMoodCount || 0} students
                  </div>
                  <div className="mb-2">
                    <strong>Medium Mood (5-7):</strong> {moodAnalytics.mediumMoodCount || 0} students
                  </div>
                  <div className="mb-2">
                    <strong>Low Mood (1-4):</strong> {moodAnalytics.lowMoodCount || 0} students
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Recent Trends</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <strong>Improving:</strong> {moodAnalytics.improvingCount || 0} students
                  </div>
                  <div className="mb-2">
                    <strong>Stable:</strong> {moodAnalytics.stableCount || 0} students
                  </div>
                  <div className="mb-2">
                    <strong>Declining:</strong> {moodAnalytics.decliningCount || 0} students
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Create Recommendation Modal */}
      <Modal show={showRecommendationModal} onHide={() => setShowRecommendationModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Create Recommendation for {selectedStudent?.first_name} {selectedStudent?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateRecommendation}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newRecommendation.type}
                onChange={(e) => setNewRecommendation({...newRecommendation, type: e.target.value})}
              >
                <option value="academic">Academic</option>
                <option value="wellness">Wellness</option>
                <option value="personal">Personal</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={newRecommendation.priority}
                onChange={(e) => setNewRecommendation({...newRecommendation, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newRecommendation.title}
                onChange={(e) => setNewRecommendation({...newRecommendation, title: e.target.value})}
                placeholder="Brief title for the recommendation"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newRecommendation.description}
                onChange={(e) => setNewRecommendation({...newRecommendation, description: e.target.value})}
                placeholder="Detailed recommendation for the student"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRecommendationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Send Recommendation
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FacultyDashboard;
