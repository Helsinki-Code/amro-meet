'use client';

import React, { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { MeetingNotes, ActionItem } from './MeetingAssistantService';
import styles from '../../styles/MeetingAssistant.module.css';
import toast from 'react-hot-toast';

export function MeetingAssistantPanel() {
  const room = useRoomContext();
  const [notes, setNotes] = useState<MeetingNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    loadMeetingNotes();
  }, [room.name]);

  const loadMeetingNotes = async () => {
    try {
      const response = await fetch(`/api/meetings/notes?roomName=${encodeURIComponent(room.name)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notes) {
          const notes = data.notes as MeetingNotes;
          setNotes({
            ...notes,
            actionItems: Array.isArray(notes.actionItems) ? notes.actionItems : [],
            keyTopics: Array.isArray(notes.keyTopics) ? notes.keyTopics : [],
            participants: Array.isArray(notes.participants) ? notes.participants : [],
            summary: notes.summary || 'No summary available.',
          });
        }
      }
    } catch (error) {
      console.error('Error loading meeting notes:', error);
    }
  };

  const processMeeting = async () => {
    setLoading(true);
    try {
      const transcript = `Meeting in room: ${room.name}\nParticipants: ${Array.from(room.remoteParticipants.values()).map(p => p.identity || p.name || 'Unknown').join(', ')}\n\n[Transcript would be captured from audio stream]`;

      const response = await fetch('/api/meetings/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
          transcript,
          participants: Array.from(room.remoteParticipants.values()).map(p => p.identity || p.name || 'Unknown'),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notes) {
          setNotes(data.notes);
          toast.success('Meeting notes generated successfully!');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process meeting');
      }
    } catch (error) {
      console.error('Error processing meeting:', error);
      toast.error('Failed to process meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setAnswering(true);
    setAnswer('');
    try {
      const response = await fetch('/api/meetings/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
          question: question.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.answer) {
          setAnswer(data.answer);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to answer question');
        setAnswer('Unable to answer the question. Please try again.');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to answer question. Please try again.');
      setAnswer('An error occurred. Please try again.');
    } finally {
      setAnswering(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setShowPanel(true)}
        aria-label="Open Meeting Assistant"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2L2 7L10 12L18 7L10 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 13L10 18L18 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 10L10 15L18 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Assistant</span>
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Meeting Assistant</h3>
        <button
          className={styles.closeButton}
          onClick={() => setShowPanel(false)}
          aria-label="Close Meeting Assistant"
        >
          ×
        </button>
      </div>

      <div className={styles.panelContent}>
        {!notes && (
          <div className={styles.emptyState}>
            <p>No meeting notes available yet.</p>
            <button
              className={styles.processButton}
              onClick={processMeeting}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Generate Meeting Notes'}
            </button>
          </div>
        )}

        {notes && (
          <>
            <div className={styles.notesSection}>
              <h4>Meeting Summary</h4>
              <p className={styles.summary}>{notes.summary || 'No summary available.'}</p>

              {notes.actionItems && Array.isArray(notes.actionItems) && notes.actionItems.length > 0 && (
                <div className={styles.actionItems}>
                  <h4>Action Items</h4>
                  <ul>
                    {notes.actionItems.map((item: ActionItem, index: number) => (
                      <li key={index} className={styles.actionItem}>
                        <div className={styles.actionHeader}>
                          <span className={styles.actionDescription}>{item.description}</span>
                          <span className={`${styles.priority} ${styles[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        {(item.assignee || item.dueDate) && (
                          <div className={styles.actionMeta}>
                            {item.assignee && <span>Assigned: {item.assignee}</span>}
                            {item.dueDate && <span>Due: {item.dueDate}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {notes.keyTopics && Array.isArray(notes.keyTopics) && notes.keyTopics.length > 0 && (
                <div className={styles.topics}>
                  <h4>Key Topics</h4>
                  <div className={styles.topicsList}>
                    {notes.keyTopics.map((topic, index) => (
                      <span key={index} className={styles.topic}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {notes.participants && Array.isArray(notes.participants) && notes.participants.length > 0 && (
                <div className={styles.participants}>
                  <h4>Participants</h4>
                  <p>{notes.participants.join(', ')}</p>
                </div>
              )}
            </div>

            <div className={styles.qaSection}>
              <h4>Ask About This Meeting</h4>
              <div className={styles.qaInput}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask any question about the meeting..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !answering) {
                      askQuestion();
                    }
                  }}
                  disabled={answering}
                />
                <button
                  className={styles.askButton}
                  onClick={askQuestion}
                  disabled={answering || !question.trim()}
                >
                  {answering ? 'Asking...' : 'Ask'}
                </button>
              </div>

              {answer && (
                <div className={styles.answer}>
                  <h5>Answer:</h5>
                  <p>{answer}</p>
                </div>
              )}
            </div>

            <button
              className={styles.refreshButton}
              onClick={loadMeetingNotes}
              disabled={loading}
            >
              Refresh Notes
            </button>
          </>
        )}
      </div>
    </div>
  );
}

