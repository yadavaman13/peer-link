import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button.jsx';
import { Badge } from '../../shared/components/Badge.jsx';
import { shortId, timeAgo } from '../../shared/utils/formatters.js';
import { Copy, Check, Users, ArrowRight } from 'lucide-react';
import { useToast } from '../../shared/hooks/useToast.js';

export function RoomCard({ room }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const { roomId, participants = 0, createdAt } = room;

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      showToast('Room ID copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy room ID', 'error');
    }
  }

  return (
    <tr>
      <td>
        <div className="room-id-cell">
          <span className="room-id-code" title={roomId}>
            {shortId(roomId, 10, 6)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            isIcon
            onClick={handleCopy}
            title="Copy full room ID"
            aria-label="Copy room ID"
          >
            {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
          </Button>
        </div>
      </td>
      <td>
        <Badge variant={participants > 0 ? 'success' : 'default'} dot={participants > 0}>
          <Users size={12} style={{ marginRight: '2px' }} />
          {participants} {participants === 1 ? 'peer' : 'peers'}
        </Badge>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{timeAgo(createdAt)}</td>
      <td style={{ textAlign: 'right' }}>
        <Link to={`/room/${roomId}/lobby`}>
          <Button variant="outline" size="sm">
            Join
            <ArrowRight size={13} />
          </Button>
        </Link>
      </td>
    </tr>
  );
}
