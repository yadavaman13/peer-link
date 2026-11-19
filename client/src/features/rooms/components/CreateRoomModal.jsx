import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRooms } from '../hooks/useRooms.js';
import { useToast } from '../../shared/hooks/useToast.js';
import { Modal } from '../../shared/components/Modal.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { Video } from 'lucide-react';

export function CreateRoomModal({ isOpen, onClose }) {
  const { createRoom } = useRooms();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [maxParticipants, setMaxParticipants] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await createRoom({ maxParticipants: Number(maxParticipants) });
      showToast('Room created successfully', 'success');
      onClose();
      navigate(`/room/${data.roomId}/lobby`);
    } catch (err) {
      showToast(err.message || 'Failed to create room', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Meeting"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleCreate} isLoading={isLoading}>
            <Video size={16} />
            Start Room
          </Button>
        </>
      }
    >
      <form onSubmit={handleCreate}>
        <div className="input-group">
          <label htmlFor="max-participants" className="input-label">
            Maximum Participants
          </label>
          <select
            id="max-participants"
            className="input-field"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
          >
            <option value="2">2 Participants (1-on-1)</option>
            <option value="4">4 Participants (Small Team)</option>
            <option value="6">6 Participants (Standard)</option>
            <option value="8">8 Participants (Maximum)</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Allocates dedicated Mediasoup WebRTC router transports on the SFU server.
          </span>
        </div>
      </form>
    </Modal>
  );
}
