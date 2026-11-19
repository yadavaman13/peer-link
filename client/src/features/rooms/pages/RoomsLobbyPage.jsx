import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { RoomProvider } from '../context/RoomContext.jsx';
import { CreateRoomModal } from '../components/CreateRoomModal.jsx';
import { JoinRoomInput } from '../components/JoinRoomInput.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { Video, KeyRound } from 'lucide-react';
import '../styles/rooms.css';

function RoomsLobbyContent() {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="rooms-lobby">
      <div className="lobby-header">
        <h1 className="lobby-title">Meeting Spaces</h1>
        <p className="lobby-subtitle">
          Welcome back, {user?.firstName}. Create or join high-fidelity SFU audio & video rooms.
        </p>
      </div>

      <div className="lobby-actions-grid">
        <div className="action-card">
          <div>
            <div className="action-card-icon">
              <Video size={20} />
            </div>
            <h2 className="action-card-title">New Meeting</h2>
            <p className="action-card-desc">
              Start an instant SFU session with dedicated WebRTC media forwarding.
            </p>
          </div>
          <Button variant="solid" onClick={() => setIsCreateModalOpen(true)}>
            <Video size={16} />
            Create Meeting
          </Button>
        </div>

        <div className="action-card">
          <div>
            <div className="action-card-icon">
              <KeyRound size={20} />
            </div>
            <h2 className="action-card-title">Join Existing Meeting</h2>
            <p className="action-card-desc">Enter a meeting UUID code or link shared by a peer.</p>
          </div>
          <JoinRoomInput />
        </div>
      </div>

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}

export function RoomsLobbyPage() {
  return (
    <RoomProvider>
      <RoomsLobbyContent />
    </RoomProvider>
  );
}
