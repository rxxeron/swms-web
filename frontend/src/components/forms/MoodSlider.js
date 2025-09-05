import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

const MoodSlider = ({ onMoodSubmit, initialMood = 5, disabled = false }) => {
  const [moodLevel, setMoodLevel] = useState(initialMood);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mood emojis and descriptions
  const moodData = {
    1: { emoji: '😢', description: 'Very Sad', color: '#dc3545' },
    2: { emoji: '😟', description: 'Sad', color: '#dc3545' },
    3: { emoji: '😕', description: 'Feeling Down', color: '#fd7e14' },
    4: { emoji: '😐', description: 'Not Great', color: '#fd7e14' },
    5: { emoji: '😑', description: 'Neutral', color: '#ffc107' },
    6: { emoji: '🙂', description: 'Okay', color: '#ffc107' },
    7: { emoji: '😊', description: 'Good', color: '#20c997' },
    8: { emoji: '😄', description: 'Happy', color: '#20c997' },
    9: { emoji: '😁', description: 'Very Happy', color: '#28a745' },
    10: { emoji: '🤩', description: 'Feeling Great!', color: '#28a745' }
  };

  const currentMood = moodData[moodLevel];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await onMoodSubmit({
        mood_level: moodLevel,
        notes: notes.trim()
      });
      
      // Reset notes after successful submission
      setNotes('');
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mood-slider-container">
      <Card.Body>
        <div className="text-center">
          <h3 className="mb-4">How are you feeling today?</h3>
          
          {/* Mood Emoji Display */}
          <div 
            className="mood-emoji"
            style={{ color: currentMood.color }}
          >
            {currentMood.emoji}
          </div>
          
          {/* Mood Level Display */}
          <div className="mood-level mb-3">
            <h4 style={{ color: currentMood.color }}>
              {moodLevel}/10
            </h4>
          </div>
          
          {/* Mood Description */}
          <div 
            className="mood-description mb-4"
            style={{ color: currentMood.color }}
          >
            {currentMood.description}
          </div>
          
          {/* Mood Slider */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Range
                className="mood-slider"
                min={1}
                max={10}
                value={moodLevel}
                onChange={(e) => setMoodLevel(parseInt(e.target.value))}
                disabled={disabled}
                style={{
                  background: `linear-gradient(to right, 
                    #dc3545 0%, 
                    #fd7e14 25%, 
                    #ffc107 50%, 
                    #20c997 75%, 
                    #28a745 100%)`
                }}
              />
              <div className="d-flex justify-content-between mt-2">
                <small className="text-muted">1 - Very Sad</small>
                <small className="text-muted">10 - Very Happy</small>
              </div>
            </Form.Group>
            
            {/* Notes Section */}
            <Form.Group className="mb-4">
              <Form.Label>Additional Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us more about how you're feeling today..."
                maxLength={1000}
                disabled={disabled}
              />
              <Form.Text className="text-muted">
                {notes.length}/1000 characters
              </Form.Text>
            </Form.Group>
            
            {/* Submit Button */}
            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="btn-mood"
              disabled={disabled || isSubmitting}
              style={{ backgroundColor: currentMood.color, borderColor: currentMood.color }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-heart me-2"></i>
                  Submit Mood Entry
                </>
              )}
            </Button>
          </Form>
          
          {/* Low Mood Warning */}
          {moodLevel < 4 && (
            <div className="alert alert-warning mt-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>We're here to help!</strong> 
              <br />
              Your mood level indicates you might benefit from speaking with a counselor. 
              A consultation will be automatically recommended.
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MoodSlider;
