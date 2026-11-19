import React from 'react';
import { VideoTile } from './VideoTile.jsx';
import '../styles/meeting.css';

export function VideoGrid({
  localStream,
  localUser,
  isMicOn,
  isCameraOn,
  isHost = false,
  remoteStreams = {},
  participants = [],
}) {
  // Build a complete list of remote participants
  const participantMap = new Map();

  for (const p of participants) {
    const pid = typeof p === 'string' ? p : p.id;
    participantMap.set(pid, {
      id: pid,
      name: typeof p === 'object' && p.name ? p.name : `Peer ${pid.slice(0, 5)}`,
      user: typeof p === 'object' ? p.user : null,
      isHost: typeof p === 'object' ? !!p.isHost : false,
    });
  }

  // Ensure any remoteStreams with unknown participant IDs also get rendered
  for (const pid of Object.keys(remoteStreams)) {
    if (!participantMap.has(pid)) {
      participantMap.set(pid, {
        id: pid,
        name: `Peer ${pid.slice(0, 5)}`,
        user: null,
        isHost: false,
      });
    }
  }

  const allRemotes = Array.from(participantMap.values());
  const totalCount = 1 + allRemotes.length;

  const gridClass =
    totalCount === 1
      ? 'grid-1'
      : totalCount === 2
        ? 'grid-2'
        : totalCount <= 4
          ? `grid-${totalCount}`
          : 'grid-6';

  const localName = localUser ? `${localUser.firstName} ${localUser.lastName}` : 'You';

  return (
    <div className="video-grid-container">
      <div className={`video-grid ${gridClass}`}>
        {/* Local Participant Tile */}
        <VideoTile
          stream={localStream}
          isLocal
          isHost={isHost}
          name={localName}
          isMuted={!isMicOn}
          isCameraOff={!isCameraOn}
        />

        {/* Remote Participant Tiles */}
        {allRemotes.map((remote) => {
          const stream = remoteStreams[remote.id] || null;
          return (
            <VideoTile
              key={remote.id}
              participantId={remote.id}
              stream={stream}
              name={remote.name}
              isHost={remote.isHost}
              isCameraOff={
                !stream ||
                stream.getVideoTracks().length === 0 ||
                !stream.getVideoTracks()[0]?.enabled
              }
            />
          );
        })}
      </div>
    </div>
  );
}
