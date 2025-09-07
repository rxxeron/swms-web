import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';

const AppointmentForm = ({ appointment, consultantList, studentList, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    consultant_id: '',
    appointment_date: '',
    appointment_time: '',
    student_notes: '',
    requested_by: 'admin'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        student_id: appointment.student_id || '',
        consultant_id: appointment.consultant_id || '',
        appointment_date: appointment.appointment_date ? appointment.appointment_date.split('T')[0] : '',
        appointment_time: appointment.appointment_time || '',
        student_notes: appointment.student_notes || '',
        requested_by: appointment.requested_by || 'admin'
      });
    }
  }, [appointment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.student_id || !formData.consultant_id || !formData.appointment_date || !formData.appointment_time) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if date is not in the past
    const selectedDate = new Date(formData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Appointment date cannot be in the past');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots from 9 AM to 5 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Student <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a student...</option>
              {studentList.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.student_id} ({student.email})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Consultant <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="consultant_id"
              value={formData.consultant_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a consultant...</option>
              {consultantList.map(consultant => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name} ({consultant.email})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Appointment Date <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Appointment Time <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="appointment_time"
              value={formData.appointment_time}
              onChange={handleChange}
              required
            >
              <option value="">Select time...</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Student Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="student_notes"
          value={formData.student_notes}
          onChange={handleChange}
          placeholder="Any specific notes or requests for this appointment..."
          maxLength={1000}
        />
        <Form.Text className="text-muted">
          {formData.student_notes.length}/1000 characters
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Requested By</Form.Label>
        <Form.Select
          name="requested_by"
          value={formData.requested_by}
          onChange={handleChange}
        >
          <option value="admin">Admin</option>
          <option value="student">Student</option>
          <option value="consultant">Consultant</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {appointment ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            appointment ? 'Update Appointment' : 'Create Appointment'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default AppointmentForm;
