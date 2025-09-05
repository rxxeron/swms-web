import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Form, Badge, Table } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StudentRecommendations = () => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [response, setResponse] = useState('');
  const [responseAction, setResponseAction] = useState('accept');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data);
    } catch (error) {
      setError('Failed to fetch recommendations');
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRecommendation = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/student/recommendations/${selectedRecommendation.id}`, {
        status: responseAction,
        studentFeedback: response
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Recommendation ${responseAction}ed successfully`);
      setShowResponseModal(false);
      setResponse('');
      setResponseAction('accept');
      fetchRecommendations();
    } catch (error) {
      setError('Failed to respond to recommendation');
      console.error('Error responding to recommendation:', error);
    }
  };

  const openResponseModal = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setResponse(recommendation.student_feedback || '');
    setResponseAction(recommendation.status === 'pending' ? 'accept' : recommendation.status);
    setShowResponseModal(true);
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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'declined': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading recommendations...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Recommendations</h2>
          <p className="text-muted">View and respond to recommendations from faculty</p>
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

      {/* Pending Recommendations */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            Pending Recommendations ({recommendations.filter(r => r.status === 'pending').length})
          </h5>
        </Card.Header>
        <Card.Body>
          {recommendations.filter(r => r.status === 'pending').length === 0 ? (
            <p className="text-muted">No pending recommendations</p>
          ) : (
            <Row>
              {recommendations.filter(r => r.status === 'pending').map(rec => (
                <Col md={6} lg={4} key={rec.id} className="mb-3">
                  <Card className="h-100 border-warning">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <div>
                        <Badge variant={getTypeBadgeVariant(rec.type)} className="me-2">
                          {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>{rec.title}</Card.Title>
                      <Card.Text>{rec.description}</Card.Text>
                      <div className="mb-2">
                        <small className="text-muted">
                          From: {rec.faculty_name}<br />
                          Date: {new Date(rec.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </Card.Body>
                    <Card.Footer>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openResponseModal(rec)}
                      >
                        Respond
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* All Recommendations Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">All Recommendations</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>From</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map(rec => (
                <tr key={rec.id}>
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
                  <td>{rec.faculty_name}</td>
                  <td>{new Date(rec.created_at).toLocaleDateString()}</td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(rec.status)}>
                      {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openResponseModal(rec)}
                    >
                      {rec.status === 'pending' ? 'Respond' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRecommendation?.status === 'pending' ? 'Respond to' : 'View'} Recommendation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecommendation && (
            <>
              <div className="mb-3">
                <h5>{selectedRecommendation.title}</h5>
                <div className="mb-2">
                  <Badge variant={getTypeBadgeVariant(selectedRecommendation.type)} className="me-2">
                    {selectedRecommendation.type.charAt(0).toUpperCase() + selectedRecommendation.type.slice(1)}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedRecommendation.priority)}>
                    {selectedRecommendation.priority.charAt(0).toUpperCase() + selectedRecommendation.priority.slice(1)}
                  </Badge>
                </div>
                <p><strong>From:</strong> {selectedRecommendation.faculty_name}</p>
                <p><strong>Date:</strong> {new Date(selectedRecommendation.created_at).toLocaleDateString()}</p>
                <p><strong>Description:</strong></p>
                <p>{selectedRecommendation.description}</p>
              </div>
              
              {selectedRecommendation.status === 'pending' && (
                <Form onSubmit={handleRespondToRecommendation}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Response</Form.Label>
                    <div className="mb-2">
                      <Form.Check
                        type="radio"
                        id="accept"
                        label="Accept this recommendation"
                        name="responseAction"
                        value="accept"
                        checked={responseAction === 'accept'}
                        onChange={(e) => setResponseAction(e.target.value)}
                      />
                      <Form.Check
                        type="radio"
                        id="decline"
                        label="Decline this recommendation"
                        name="responseAction"
                        value="decline"
                        checked={responseAction === 'decline'}
                        onChange={(e) => setResponseAction(e.target.value)}
                      />
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Feedback (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Share your thoughts about this recommendation..."
                    />
                  </Form.Group>
                </Form>
              )}
              
              {selectedRecommendation.status !== 'pending' && selectedRecommendation.student_feedback && (
                <div>
                  <h6>Your Previous Response:</h6>
                  <p className="text-muted">{selectedRecommendation.student_feedback}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
            Close
          </Button>
          {selectedRecommendation?.status === 'pending' && (
            <Button variant="primary" onClick={handleRespondToRecommendation}>
              Submit Response
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentRecommendations;
