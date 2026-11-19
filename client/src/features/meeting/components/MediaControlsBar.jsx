import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  Users,
  Link as LinkIcon,
  PhoneOff,
  Check,
} from 'lucide-react';
import { useToast } from '../../shared/hooks/useToast.js';
import '../styles/meeting.css';

export function MediaControlsBar({
  isMicOn,
  isCameraOn,
  isHost = false,
  onToggleMic,
  onToggleCamera,
  onOpenSettings,
  onToggleParticipants,
  participantCount = 0,
  onLeave,
}) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Meeting link copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy meeting link', 'error');
    }
  }

  return (
    <div className="controls-dock" role="toolbar" aria-label="Meeting media controls">
      {/* Mic toggle */}
      <button
        type="button"
        className={`dock-btn ${!isMicOn ? 'dock-btn-off' : ''}`}
        onClick={onToggleMic}
        title={isMicOn ? 'Mute microphone (M)' : 'Unmute microphone (M)'}
        aria-label="Toggle microphone"
      >
        {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* Camera toggle */}
      <button
        type="button"
        className={`dock-btn ${!isCameraOn ? 'dock-btn-off' : ''}`}
        onClick={onToggleCamera}
        title={isCameraOn ? 'Turn camera off (V)' : 'Turn camera on (V)'}
        aria-label="Toggle camera"
      >
        {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      {/* Hardware Settings */}
      <button
        type="button"
        className="dock-btn"
        onClick={onOpenSettings}
        title="Audio & Video Settings"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>

      <div className="dock-divider" />

      {/* Copy link */}
      <button
        type="button"
        className="dock-btn"
        onClick={handleCopyLink}
        title="Copy meeting invite link"
        aria-label="Copy meeting link"
      >
        {copied ? <Check size={20} style={{ color: 'var(--success)' }} /> : <LinkIcon size={20} />}
      </button>

      {/* Participants drawer toggle */}
      <button
        type="button"
        className="dock-btn"
        onClick={onToggleParticipants}
        title="View participants"
        aria-label="View participants"
      >
        <Users size={20} />
        {participantCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
            }}
          />
        )}
      </button>

      <div className="dock-divider" />

      {/* Leave or End meeting */}
      <button
        type="button"
        className="dock-btn-danger"
        onClick={onLeave}
        title={isHost ? 'End meeting for everyone' : 'Leave meeting'}
        aria-label={isHost ? 'End meeting for everyone' : 'Leave meeting'}
      >
        <PhoneOff size={18} />
        <span>{isHost ? 'End Meet' : 'Leave'}</span>
      </button>
    </div>
  );
}
