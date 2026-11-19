import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MeetingProvider } from '../context/MeetingContext.jsx';
import { useMeeting } from '../hooks/useMeeting.js';
import { useMediaDevices } from '../hooks/useMediaDevices.js';
import { VideoGrid } from '../components/VideoGrid.jsx';
import { MediaControlsBar } from '../components/MediaControlsBar.jsx';
import { DeviceSelectModal } from '../components/DeviceSelectModal.jsx';
import { ParticipantsDrawer } from '../components/ParticipantsDrawer.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { shortId } from '../../shared/utils/formatters.js';
import { Copy, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../shared/hooks/useToast.js';
import '../styles/meeting.css';

function MeetingRoomContent() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const {
    status,
    participants,
    remoteStreams,
    localStream,
    isMicOn,
    isCameraOn,
    isHost,
    meetingEndedReason,
    error,
    user,
    joinMeeting,
    toggleMic,
    toggleCamera,
    leaveMeeting,
    endMeeting,
  } = useMeeting();

  const {
    audioDevices,
    videoDevices,
    selectedAudioId,
    selectedVideoId,
    startMedia,
    changeAudioDevice,
    changeVideoDevice,
  } = useMediaDevices();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize meeting on mount
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      const initialMic = location.state?.initialMic ?? true;
      const initialCamera = location.state?.initialCamera ?? true;

      try {
        const stream = await startMedia(
          location.state?.selectedAudioId,
          location.state?.selectedVideoId
        );

        if (!isCancelled) {
          await joinMeeting({
            targetRoomId: roomId,
            stream,
            initialMic,
            initialCamera,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Initialization error:', err);
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        toggleMic();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleCamera();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic, toggleCamera]);

  // Handle meeting ended by host
  useEffect(() => {
    if (meetingEndedReason) {
      showToast(meetingEndedReason, 'info');
      navigate('/rooms');
    }
  }, [meetingEndedReason, navigate, showToast]);

  function handleLeave() {
    if (isHost) {
      endMeeting();
    } else {
      leaveMeeting();
    }
    navigate('/rooms');
  }

  async function handleCopyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      showToast('Room ID copied', 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy room ID', 'error');
    }
  }

  if (status === 'connecting') {
    return (
      <div className="meeting-stage" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-inverse)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRightColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
            Connecting to SFU Room...
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }} className="font-mono">
            {roomId}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="meeting-stage" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth: '420px',
            backgroundColor: '#1c1917',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            color: 'var(--text-inverse)',
          }}
        >
          <AlertCircle size={36} style={{ color: 'var(--danger)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Connection Failed
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            {error || 'Unable to establish WebRTC media connection with SFU server.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button variant="solid" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
            <Button variant="outline" onClick={handleLeave}>
              <ArrowLeft size={16} />
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-stage">
      {/* Top meeting bar */}
      <header className="meeting-header">
        <div className="meeting-header-info">
          <span className="meeting-code-pill" title={roomId}>
            {shortId(roomId, 8, 4)}
          </span>
          <button
            type="button"
            onClick={handleCopyRoomId}
            style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
            title="Copy room ID"
            aria-label="Copy room ID"
          >
            {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            {1 + participants.length} connected
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
            }}
          />
        </div>
      </header>

      {/* Video Tile Grid */}
      <VideoGrid
        localStream={localStream}
        localUser={user}
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isHost={isHost}
        participants={participants}
        remoteStreams={remoteStreams}
      />

      {/* Floating Bottom Media Controls */}
      <MediaControlsBar
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        isHost={isHost}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
        participantCount={participants.length}
        onLeave={handleLeave}
      />

      {/* Participants Drawer */}
      <ParticipantsDrawer
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        localUser={user}
        isHost={isHost}
        participants={participants}
      />

      {/* Audio/Video Device Selector Modal */}
      <DeviceSelectModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioDevices={audioDevices}
        videoDevices={videoDevices}
        selectedAudioId={selectedAudioId}
        selectedVideoId={selectedVideoId}
        onSelectDevices={async ({ audioId, videoId }) => {
          if (audioId) await changeAudioDevice(audioId);
          if (videoId) await changeVideoDevice(videoId);
        }}
      />
    </div>
  );
}

export function MeetingRoomPage() {
  return (
    <MeetingProvider>
      <MeetingRoomContent />
    </MeetingProvider>
  );
}
