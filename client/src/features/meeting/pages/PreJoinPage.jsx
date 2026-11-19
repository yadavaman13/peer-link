import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useMediaDevices } from '../hooks/useMediaDevices.js';
import { Button } from '../../shared/components/Button.jsx';
import { Mic, MicOff, Video, VideoOff, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import '../styles/meeting.css';

export function PreJoinPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const {
    localStream,
    isMicOn,
    isCameraOn,
    audioDevices,
    videoDevices,
    selectedAudioId,
    selectedVideoId,
    permissionError,
    startMedia,
    toggleMic,
    toggleCamera,
    changeAudioDevice,
    changeVideoDevice,
  } = useMediaDevices();

  // Start media preview on mount
  useEffect(() => {
    startMedia();
    return () => {
      // Don't stop tracks if navigating to /room/:roomId (they will be reused or cleaned up)
    };
  }, [startMedia]);

  // Attach local stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  function handleJoin() {
    // Navigate to actual meeting room page, passing media state in location.state
    navigate(`/room/${roomId}`, {
      state: {
        initialMic: isMicOn,
        initialCamera: isCameraOn,
        selectedAudioId,
        selectedVideoId,
      },
    });
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U';

  return (
    <div className="prejoin-page">
      <div className="prejoin-card">
        <div className="prejoin-header">
          <h1 className="prejoin-title">Check your audio & video</h1>
          <p className="prejoin-room-id">Meeting ID: {roomId}</p>
        </div>

        {permissionError && (
          <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{permissionError} - Please allow camera and microphone access.</span>
          </div>
        )}

        <div className="prejoin-preview-wrapper">
          {isCameraOn && localStream ? (
            <video ref={videoRef} autoPlay playsInline muted className="prejoin-video" />
          ) : (
            <div className="prejoin-avatar-fallback">{initials}</div>
          )}

          <div className="prejoin-controls-overlay">
            <Button
              variant="outline"
              size="md"
              isIcon
              className={!isMicOn ? 'btn-off' : ''}
              onClick={toggleMic}
              title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </Button>
            <Button
              variant="outline"
              size="md"
              isIcon
              className={!isCameraOn ? 'btn-off' : ''}
              onClick={toggleCamera}
              title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </Button>
          </div>
        </div>

        <div className="prejoin-device-row">
          <div className="input-group">
            <label htmlFor="mic-select" className="input-label">
              Microphone
            </label>
            <select
              id="mic-select"
              className="input-field"
              value={selectedAudioId}
              onChange={(e) => changeAudioDevice(e.target.value)}
              disabled={!audioDevices.length}
            >
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="cam-select" className="input-label">
              Camera
            </label>
            <select
              id="cam-select"
              className="input-field"
              value={selectedVideoId}
              onChange={(e) => changeVideoDevice(e.target.value)}
              disabled={!videoDevices.length}
            >
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="prejoin-actions">
          <Link to="/rooms">
            <Button variant="ghost" size="md">
              <ArrowLeft size={16} />
              Back to Rooms
            </Button>
          </Link>
          <Button variant="solid" size="lg" onClick={handleJoin}>
            Join Now
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
