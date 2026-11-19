import { useContext } from 'react';
import { MeetingContext } from '../context/MeetingContext.jsx';

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
