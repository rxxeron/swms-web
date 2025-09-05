import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Form, Badge, Table, Calendar } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StudentAppointments = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    type: 'consultation',
    reason: '',
    urgency: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, slotsRes, consultantsRes] = await Promise.all([
        axios.get('/api/student/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/student/available-slots', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/student/consultants', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAppointments(appointmentsRes.data);
      setAvailableSlots(slotsRes.data);
      setConsultants(consultantsRes.data);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/student/appointments', {
        slotId: selectedSlot.id,
        consultantId: selectedSlot.consultant_id,
        appointmentType: bookingDetails.type,
        reason: bookingDetails.reason,
        urgency: bookingDetails.urgency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Appointment booked successfully');
      setShowBookingModal(false);
      setBookingDetails({
        type: 'consultation',
        reason: '',
        urgency: 'medium'
      });
      fetchData();
    } catch (error) {
      setError('Failed to book appointment');
      console.error('Error booking appointment:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await axios.patch(`/api/student/appointments/${appointmentId}`, {
        status: 'cancelled'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Appointment cancelled successfully');
      fetchData();
    } catch (error) {
      setError('Failed to cancel appointment');
      console.error('Error cancelling appointment:', error);
    }
  };

  const openBookingModal = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
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

  const getUrgencyBadgeVariant = (urgency) => {
    switch (urgency) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointment_date) > now && 
      (apt.status === 'confirmed' || apt.status === 'pending')
    ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  };

  const getTodaysSlots = () => {
    const today = new Date().toDateString();
    return availableSlots.filter(slot => 
      new Date(slot.slot_date).toDateString() === today
    );
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading appointments...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Appointments</h2>
          <p className="text-muted">Book and manage your counseling appointments</p>
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

      {/* Upcoming Appointments Alert */}
      {getUpcomingAppointments().length > 0 && (
        <Alert variant="info">
          <strong>Upcoming:</strong> You have {getUpcomingAppointments().length} upcoming appointment(s).
        </Alert>
      )}

      {/* Quick Stats */}
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
              <Card.Title>Upcoming</Card.Title>
              <h3 className="text-success">{getUpcomingAppointments().length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Available Today</Card.Title>
              <h3 className="text-info">{getTodaysSlots().length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Consultants</Card.Title>
              <h3 className="text-warning">{consultants.length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* My Appointments */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">My Appointments</h5>
        </Card.Header>
        <Card.Body>
          {appointments.length === 0 ? (
            <p className="text-muted">No appointments booked yet</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Consultant</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Urgency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td>{new Date(appointment.appointment_date).toLocaleString()}</td>
                    <td>{appointment.consultant_name}</td>
                    <td>{appointment.appointment_type}</td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      {appointment.urgency && (
                        <Badge variant={getUrgencyBadgeVariant(appointment.urgency)}>
                          {appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1)}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && 
                       new Date(appointment.appointment_date) > new Date() && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {appointment.status === 'completed' && appointment.notes && (
                        <Button
                          variant="outline-info"
                          size="sm"
                        >
                          View Notes
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Available Slots */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Available Appointment Slots</h5>
        </Card.Header>
        <Card.Body>
          {availableSlots.length === 0 ? (
            <p className="text-muted">No available slots at the moment</p>
          ) : (
            <>
              {/* Group slots by date */}
              {Object.entries(
                availableSlots.reduce((groups, slot) => {
                  const date = new Date(slot.slot_date).toDateString();
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(slot);
                  return groups;
                }, {})
              ).map(([date, slots]) => (
                <div key={date} className="mb-4">
                  <h6 className="text-primary">{date}</h6>
                  <Row>
                    {slots.map(slot => (
                      <Col md={6} lg={4} key={slot.id} className="mb-3">
                        <Card className="h-100">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong>{slot.start_time} - {slot.end_time}</strong>
                              </div>
                              <Badge variant="primary">{slot.appointment_type}</Badge>
                            </div>
                            <p className="mb-2">
                              <strong>Consultant:</strong> {slot.consultant_name}
                            </p>
                            <p className="text-muted mb-3">{slot.consultant_specialization}</p>
                          </Card.Body>
                          <Card.Footer>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openBookingModal(slot)}
                              disabled={slot.is_booked}
                            >
                              {slot.is_booked ? 'Booked' : 'Book Appointment'}
                            </Button>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Book Appointment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleBookAppointment}>
          <Modal.Body>
            {selectedSlot && (
              <>
                <div className="mb-3 p-3 bg-light rounded">
                  <h6>Appointment Details</h6>
                  <p><strong>Date:</strong> {new Date(selectedSlot.slot_date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}</p>
                  <p><strong>Consultant:</strong> {selectedSlot.consultant_name}</p>
                  <p><strong>Specialization:</strong> {selectedSlot.consultant_specialization}</p>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Appointment Type</Form.Label>
                  <Form.Select
                    value={bookingDetails.type}
                    onChange={(e) => setBookingDetails({...bookingDetails, type: e.target.value})}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="counseling">Counseling</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Urgency Level</Form.Label>
                  <Form.Select
                    value={bookingDetails.urgency}
                    onChange={(e) => setBookingDetails({...bookingDetails, urgency: e.target.value})}
                  >
                    <option value="low">Low - General guidance</option>
                    <option value="medium">Medium - Need support soon</option>
                    <option value="high">High - Urgent assistance needed</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason for Appointment (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={bookingDetails.reason}
                    onChange={(e) => setBookingDetails({...bookingDetails, reason: e.target.value})}
                    placeholder="Brief description of what you'd like to discuss..."
                  />
                  <Form.Text className="text-muted">
                    This helps the consultant prepare for your session
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Book Appointment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StudentAppointments;
