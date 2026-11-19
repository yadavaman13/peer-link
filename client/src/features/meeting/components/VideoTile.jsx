import React, { useRef, useEffect } from 'react';
import { MicOff } from 'lucide-react';
import '../styles/meeting.css';

export function VideoTile({
  stream,
  participantId,
  isLocal = false,
  isHost = false,
  name = 'Participant',
  isMuted = false,
  isCameraOff = false,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }, [stream, isLocal]);

  const hasVideoTrack =
    !isCameraOff &&
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].enabled;

  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'P';

  return (
    <div
      className={`video-tile ${isLocal ? 'tile-local' : ''}`}
      data-participant-id={participantId}
    >
      {/* Remote audio playback fallback (e.g. when camera is off or avatar is shown) */}
      {!isLocal && stream && <audio ref={audioRef} autoPlay playsInline />}

      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video playback to avoid feedback
        />
      ) : (
        <div className="tile-avatar-placeholder">{initials}</div>
      )}

      {isMuted && (
        <div className="tile-mic-status" title="Microphone is muted">
          <MicOff size={14} />
        </div>
      )}

      <div className="tile-tag">
        <span>{isLocal ? `${name} (You)` : name}</span>
        {isHost && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: '10px',
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Host
          </span>
        )}
      </div>
    </div>
  );
}
