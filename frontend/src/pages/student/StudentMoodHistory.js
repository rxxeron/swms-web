import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Form, Button, Badge } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StudentMoodHistory = () => {
  const { token } = useAuth();
  const [moodEntries, setMoodEntries] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('30'); // days

  useEffect(() => {
    fetchMoodData();
  }, [filterPeriod]);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      const [entriesRes, analyticsRes] = await Promise.all([
        axios.get(`/api/student/mood-entries?days=${filterPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/student/mood-analytics?days=${filterPeriod}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setMoodEntries(entriesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      setError('Failed to fetch mood data');
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (mood) => {
    if (mood >= 8) return '#28a745'; // green
    if (mood >= 6) return '#ffc107'; // yellow
    if (mood >= 4) return '#fd7e14'; // orange
    return '#dc3545'; // red
  };

  const getMoodEmoji = (mood) => {
    if (mood >= 9) return '😊';
    if (mood >= 8) return '😌';
    if (mood >= 7) return '🙂';
    if (mood >= 6) return '😐';
    if (mood >= 5) return '😕';
    if (mood >= 4) return '😞';
    if (mood >= 3) return '😢';
    if (mood >= 2) return '😭';
    return '😰';
  };

  const getMoodLabel = (mood) => {
    if (mood >= 9) return 'Excellent';
    if (mood >= 8) return 'Very Good';
    if (mood >= 7) return 'Good';
    if (mood >= 6) return 'Okay';
    if (mood >= 5) return 'Fair';
    if (mood >= 4) return 'Poor';
    if (mood >= 3) return 'Bad';
    if (mood >= 2) return 'Very Bad';
    return 'Terrible';
  };

  const getTrendBadge = (trend) => {
    if (trend > 0) return <Badge variant="success">↗ Improving</Badge>;
    if (trend < 0) return <Badge variant="danger">↘ Declining</Badge>;
    return <Badge variant="info">→ Stable</Badge>;
  };

  // Simple chart visualization using CSS
  const renderMoodChart = () => {
    if (moodEntries.length === 0) return null;

    const maxMood = 10;
    const chartHeight = 200;

    return (
      <div style={{ position: 'relative', height: chartHeight + 40, padding: '20px 0' }}>
        {/* Y-axis labels */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: chartHeight }}>
          {[10, 8, 6, 4, 2, 0].map(value => (
            <div
              key={value}
              style={{
                position: 'absolute',
                top: `${((maxMood - value) / maxMood) * chartHeight}px`,
                left: '-10px',
                fontSize: '12px',
                color: '#666'
              }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ marginLeft: '30px', height: chartHeight, position: 'relative', border: '1px solid #ddd' }}>
          {/* Grid lines */}
          {[8, 6, 4, 2].map(value => (
            <div
              key={value}
              style={{
                position: 'absolute',
                top: `${((maxMood - value) / maxMood) * chartHeight}px`,
                left: 0,
                right: 0,
                borderTop: '1px solid #eee'
              }}
            />
          ))}

          {/* Data points and line */}
          {moodEntries.map((entry, index) => {
            const x = (index / (moodEntries.length - 1 || 1)) * 100;
            const y = ((maxMood - entry.mood_score) / maxMood) * chartHeight;
            
            return (
              <div key={entry.id}>
                {/* Data point */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}px`,
                    width: '8px',
                    height: '8px',
                    backgroundColor: getMoodColor(entry.mood_score),
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer'
                  }}
                  title={`${new Date(entry.entry_date).toLocaleDateString()}: ${entry.mood_score} - ${getMoodLabel(entry.mood_score)}`}
                />
                
                {/* Line to next point */}
                {index < moodEntries.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}px`,
                      width: `${((1 / (moodEntries.length - 1)) * 100)}%`,
                      height: '2px',
                      backgroundColor: getMoodColor(entry.mood_score),
                      transformOrigin: 'left center',
                      transform: `translate(0, -50%) rotate(${Math.atan2(
                        ((maxMood - moodEntries[index + 1].mood_score) / maxMood) * chartHeight - y,
                        ((1 / (moodEntries.length - 1)) * 100) * (document.querySelector('.chart-container')?.offsetWidth || 400) / 100
                      ) * 180 / Math.PI}deg)`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis dates */}
        <div style={{ marginLeft: '30px', marginTop: '10px', position: 'relative' }}>
          {moodEntries.length > 0 && (
            <>
              <div style={{ position: 'absolute', left: 0, fontSize: '12px', color: '#666' }}>
                {new Date(moodEntries[0].entry_date).toLocaleDateString()}
              </div>
              <div style={{ position: 'absolute', right: 0, fontSize: '12px', color: '#666' }}>
                {new Date(moodEntries[moodEntries.length - 1].entry_date).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div>Loading mood history...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Mood History</h2>
          <p className="text-muted">Track your emotional wellness over time</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filter Controls */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Time Period</Form.Label>
            <Form.Select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Analytics Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Average Mood</Card.Title>
              <h3 style={{ color: getMoodColor(analytics.averageMood || 0) }}>
                {analytics.averageMood ? analytics.averageMood.toFixed(1) : 'N/A'}
              </h3>
              <small className="text-muted">
                {analytics.averageMood ? getMoodLabel(analytics.averageMood) : ''}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Total Entries</Card.Title>
              <h3 className="text-primary">{analytics.totalEntries || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Trend</Card.Title>
              <div className="mt-2">
                {analytics.trend !== undefined ? getTrendBadge(analytics.trend) : 'No data'}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Best Day</Card.Title>
              <h3 style={{ color: getMoodColor(analytics.highestMood || 0) }}>
                {analytics.highestMood ? analytics.highestMood.toFixed(1) : 'N/A'}
              </h3>
              <small className="text-muted">
                {analytics.bestDay ? new Date(analytics.bestDay).toLocaleDateString() : ''}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mood Chart */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Mood Trend</h5>
        </Card.Header>
        <Card.Body className="chart-container">
          {moodEntries.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No mood entries found for the selected period</p>
              <Button variant="primary" href="/student/dashboard">
                Record Your First Mood Entry
              </Button>
            </div>
          ) : (
            renderMoodChart()
          )}
        </Card.Body>
      </Card>

      {/* Recent Entries */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Mood Entries</h5>
        </Card.Header>
        <Card.Body>
          {moodEntries.length === 0 ? (
            <p className="text-muted">No entries to display</p>
          ) : (
            <Row>
              {moodEntries.slice(0, 12).map(entry => (
                <Col md={6} lg={4} key={entry.id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="h4 mb-0" style={{ color: getMoodColor(entry.mood_score) }}>
                          {getMoodEmoji(entry.mood_score)} {entry.mood_score}/10
                        </div>
                        <Badge 
                          variant={entry.mood_score >= 7 ? 'success' : entry.mood_score >= 5 ? 'warning' : 'danger'}
                        >
                          {getMoodLabel(entry.mood_score)}
                        </Badge>
                      </div>
                      <div className="text-muted mb-2">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </div>
                      {entry.notes && (
                        <div className="small">
                          <strong>Notes:</strong> {entry.notes}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StudentMoodHistory;
