import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';

const DeactivationModal = ({ show, onHide, user, onSubmit }) => {
  const [deactivationType, setDeactivationType] = useState('temporary');
  const [deactivateUntil, setDeactivateUntil] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');

  // Generate quick selection options
  const getQuickOptions = () => {
    const now = new Date();
    const options = [];
    
    // Add quick time options
    options.push({
      label: '1 Hour',
      value: new Date(now.getTime() + 60 * 60 * 1000)
    });
    options.push({
      label: '1 Day',
      value: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    });
    options.push({
      label: '3 Days',
      value: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    });
    options.push({
      label: '1 Week',
      value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    });
    options.push({
      label: '2 Weeks',
      value: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    });
    options.push({
      label: '1 Month',
      value: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    });

    return options;
  };

  const handleQuickSelect = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
    setDeactivateUntil(date.toISOString());
  };

  const handleDateTimeChange = () => {
    if (selectedDate && selectedTime) {
      const combinedDate = new Date(`${selectedDate}T${selectedTime}`);
      setDeactivateUntil(combinedDate.toISOString());
      setError('');
    }
  };

  const handleSubmit = () => {
    setError('');

    if (deactivationType === 'temporary') {
      if (!selectedDate || !selectedTime) {
        setError('Please select both date and time for temporary deactivation');
        return;
      }

      const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
      if (selectedDateTime <= new Date()) {
        setError('Selected date and time must be in the future');
        return;
      }

      onSubmit({
        action: 'temporary',
        deactivate_until: selectedDateTime.toISOString(),
        user
      });
    } else {
      onSubmit({
        action: 'permanent',
        user
      });
    }

    // Reset form
    setDeactivationType('temporary');
    setSelectedDate('');
    setSelectedTime('');
    setDeactivateUntil('');
    setError('');
  };

  const quickOptions = getQuickOptions();

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Deactivate {user?.first_name} {user?.last_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Deactivation Type</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="temporary"
                label="Temporary Deactivation"
                name="deactivationType"
                value="temporary"
                checked={deactivationType === 'temporary'}
                onChange={(e) => setDeactivationType(e.target.value)}
              />
              <Form.Check
                type="radio"
                id="permanent"
                label="Permanent Deactivation"
                name="deactivationType"
                value="permanent"
                checked={deactivationType === 'permanent'}
                onChange={(e) => setDeactivationType(e.target.value)}
              />
            </div>
          </Form.Group>

          {deactivationType === 'temporary' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Quick Select</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {quickOptions.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleQuickSelect(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setTimeout(handleDateTimeChange, 0);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedTime}
                      onChange={(e) => {
                        setSelectedTime(e.target.value);
                        setTimeout(handleDateTimeChange, 0);
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {deactivateUntil && (
                <Alert variant="info">
                  <strong>Deactivation Until:</strong> {new Date(deactivateUntil).toLocaleString()}
                </Alert>
              )}
            </>
          )}

          {deactivationType === 'permanent' && (
            <Alert variant="warning">
              <strong>Permanent Deactivation:</strong> The user will be deactivated indefinitely until manually reactivated by an admin.
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant={deactivationType === 'temporary' ? 'warning' : 'danger'}
          onClick={handleSubmit}
        >
          {deactivationType === 'temporary' ? 'Temporarily Deactivate' : 'Permanently Deactivate'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeactivationModal;
