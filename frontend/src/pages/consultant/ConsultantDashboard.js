import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Tabs, Tab, Calendar } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ConsultantDashboard = () => {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');

  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'consultation'
  });

  const [appointmentNotes, setAppointmentNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, slotsRes, studentsRes, analyticsRes] = await Promise.all([
        axios.get('/api/consultant/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/consultant/available-slots', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/consultant/students', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/consultant/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAppointments(appointmentsRes.data);
      setAvailableSlots(slotsRes.data);
      setStudents(studentsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/consultant/available-slots', newSlot, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Available slot created successfully');
      setShowSlotModal(false);
      setNewSlot({
        date: '',
        startTime: '',
        endTime: '',
        type: 'consultation'
      });
      fetchData();
    } catch (error) {
      setError('Failed to create available slot');
      console.error('Error creating slot:', error);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status, notes = '') => {
    try {
      await axios.patch(`/api/consultant/appointments/${appointmentId}`, {
        status,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Appointment ${status} successfully`);
      setShowNotesModal(false);
      setAppointmentNotes('');
      fetchData();
    } catch (error) {
      setError('Failed to update appointment');
      console.error('Error updating appointment:', error);
    }
  };

  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentNotes(appointment.notes || '');
    setShowNotesModal(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getUrgencyBadgeVariant = (mood) => {
    if (mood <= 3) return 'danger';
    if (mood <= 5) return 'warning';
    return 'success';
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointment_date) > now && 
      apt.status === 'confirmed'
    ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading consultant dashboard...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Consultant Dashboard</h2>
          <p className="text-muted">Manage appointments and student consultations</p>
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
              <Card.Title>Total Appointments</Card.Title>
              <h3 className="text-primary">{appointments.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>This Week</Card.Title>
              <h3 className="text-success">{analytics.weeklyAppointments || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Available Slots</Card.Title>
              <h3 className="text-info">{availableSlots.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Completion Rate</Card.Title>
              <h3 className="text-warning">{analytics.completionRate || 0}%</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Appointments Alert */}
      {getUpcomingAppointments().length > 0 && (
        <Alert variant="info">
          <strong>Upcoming Appointments:</strong> You have {getUpcomingAppointments().length} confirmed appointment(s) coming up.
        </Alert>
      )}

      {/* Tabs for different sections */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="appointments" title="My Appointments">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Appointments</h5>
              <Button variant="primary" onClick={() => setShowSlotModal(true)}>
                Add Available Slot
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Student</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Student Mood</th>
                    <th>Urgency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{new Date(appointment.appointment_date).toLocaleString()}</td>
                      <td>{appointment.student_name}</td>
                      <td>{appointment.appointment_type}</td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </td>
                      <td>{appointment.student_mood || 'N/A'}</td>
                      <td>
                        {appointment.student_mood && (
                          <Badge variant={getUrgencyBadgeVariant(appointment.student_mood)}>
                            {appointment.student_mood <= 3 ? 'High' : 
                             appointment.student_mood <= 5 ? 'Medium' : 'Low'}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openNotesModal(appointment)}
                          >
                            Complete
                          </Button>
                        )}
                        {(appointment.status === 'completed' || appointment.notes) && (
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openNotesModal(appointment)}
                          >
                            Notes
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="schedule" title="My Schedule">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Available Time Slots</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {availableSlots.map(slot => (
                    <tr key={slot.id}>
                      <td>{new Date(slot.slot_date).toLocaleDateString()}</td>
                      <td>{slot.start_time}</td>
                      <td>{slot.end_time}</td>
                      <td>{slot.appointment_type}</td>
                      <td>
                        <Badge variant={slot.is_booked ? 'danger' : 'success'}>
                          {slot.is_booked ? 'Booked' : 'Available'}
                        </Badge>
                      </td>
                      <td>
                        {!slot.is_booked && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={async () => {
                              try {
                                await axios.delete(`/api/consultant/available-slots/${slot.id}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                fetchData();
                              } catch (error) {
                                setError('Failed to delete slot');
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="students" title="Student Insights">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Students I've Consulted</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Total Sessions</th>
                    <th>Last Session</th>
                    <th>Recent Mood</th>
                    <th>Progress</th>
                    <th>Next Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.first_name} {student.last_name}</td>
                      <td>{student.session_count}</td>
                      <td>
                        {student.last_session ? 
                          new Date(student.last_session).toLocaleDateString() : 
                          'Never'
                        }
                      </td>
                      <td>
                        {student.recent_mood ? (
                          <Badge variant={getUrgencyBadgeVariant(student.recent_mood)}>
                            {student.recent_mood.toFixed(1)}
                          </Badge>
                        ) : (
                          'No data'
                        )}
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
                        {student.next_appointment ? 
                          new Date(student.next_appointment).toLocaleDateString() : 
                          'None scheduled'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="analytics" title="My Analytics">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Appointment Statistics</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <strong>Total Appointments:</strong> {analytics.totalAppointments || 0}
                  </div>
                  <div className="mb-2">
                    <strong>Completed:</strong> {analytics.completedAppointments || 0}
                  </div>
                  <div className="mb-2">
                    <strong>Cancelled:</strong> {analytics.cancelledAppointments || 0}
                  </div>
                  <div className="mb-2">
                    <strong>No-shows:</strong> {analytics.noShowAppointments || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Student Impact</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <strong>Students Helped:</strong> {analytics.uniqueStudents || 0}
                  </div>
                  <div className="mb-2">
                    <strong>Avg Sessions per Student:</strong> {analytics.avgSessionsPerStudent || 0}
                  </div>
                  <div className="mb-2">
                    <strong>Student Satisfaction:</strong> {analytics.satisfactionRating || 'N/A'}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Create Available Slot Modal */}
      <Modal show={showSlotModal} onHide={() => setShowSlotModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Available Time Slot</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSlot}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Appointment Type</Form.Label>
              <Form.Select
                value={newSlot.type}
                onChange={(e) => setNewSlot({...newSlot, type: e.target.value})}
              >
                <option value="consultation">Consultation</option>
                <option value="counseling">Counseling</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSlotModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Slot
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Appointment Notes Modal */}
      <Modal show={showNotesModal} onHide={() => setShowNotesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Appointment with {selectedAppointment?.student_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <strong>Date:</strong> {selectedAppointment && new Date(selectedAppointment.appointment_date).toLocaleString()}
          </div>
          <div className="mb-3">
            <strong>Type:</strong> {selectedAppointment?.appointment_type}
          </div>
          <div className="mb-3">
            <strong>Student Mood:</strong> {selectedAppointment?.student_mood || 'Not recorded'}
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Session Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              placeholder="Add your session notes here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
            Cancel
          </Button>
          {selectedAppointment?.status === 'confirmed' && (
            <Button 
              variant="primary" 
              onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'completed', appointmentNotes)}
            >
              Complete Session
            </Button>
          )}
          {selectedAppointment?.status === 'completed' && (
            <Button 
              variant="primary" 
              onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'completed', appointmentNotes)}
            >
              Update Notes
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ConsultantDashboard;
