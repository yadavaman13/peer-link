import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/hooks/useToast.js';
import { Button } from '../../shared/components/Button.jsx';
import { ArrowRight } from 'lucide-react';

export function JoinRoomInput() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  function handleJoin(e) {
    e.preventDefault();
    let cleaned = roomIdInput.trim();
    if (!cleaned) {
      showToast('Please enter a Room ID', 'error');
      return;
    }

    // If a full URL is pasted: e.g. http://localhost:5173/room/6207a61b-...
    try {
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        const url = new URL(cleaned);
        const match = url.pathname.match(/\/room\/([^/]+)/);
        if (match && match[1]) {
          cleaned = match[1];
        }
      }
    } catch {
      // Keep cleaned as is
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleaned)) {
      showToast('Invalid Room ID format. Expected a valid UUID.', 'error');
      return;
    }

    navigate(`/room/${cleaned}/lobby`);
  }

  return (
    <form className="join-input-row" onSubmit={handleJoin}>
      <input
        type="text"
        className="join-input"
        placeholder="Enter room ID or link"
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value)}
      />
      <Button type="submit" variant="outline" disabled={!roomIdInput.trim()}>
        Join
        <ArrowRight size={14} />
      </Button>
    </form>
  );
}
