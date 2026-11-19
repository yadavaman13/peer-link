import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { PeerLinkClient } from '../sdk/PeerLinkClient.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { WS_SIGNALING_URL } from '../../../config/env.js';

const MeetingContext = createContext(null);

export function MeetingProvider({ children }) {
  const { token, user } = useAuth();
  const clientRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error | ended
  const [roomId, setRoomId] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [meetingEndedReason, setMeetingEndedReason] = useState(null);
  const [participants, setParticipants] = useState([]); // array of { id, name, user, isHost }
  const [remoteStreams, setRemoteStreams] = useState({}); // participantId -> MediaStream
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState(null);

  // Initialize client if not present
  if (!clientRef.current) {
    clientRef.current = new PeerLinkClient();
  }

  const joinMeeting = useCallback(
    async ({ targetRoomId, stream, initialMic = true, initialCamera = true }) => {
      setStatus('connecting');
      setError(null);
      setMeetingEndedReason(null);
      setRoomId(targetRoomId);
      setLocalStream(stream);
      setIsMicOn(initialMic);
      setIsCameraOn(initialCamera);

      const client = clientRef.current;

      try {
        const signalingUrl = WS_SIGNALING_URL;
        console.log('[MeetingContext] Connecting with signaling URL:', signalingUrl);

        // Setup event handlers
        client.on('participant-joined', (p) => {
          const pid = p.participantId || p.id;
          setParticipants((prev) => {
            const exists = prev.some((item) =>
              typeof item === 'string' ? item === pid : item.id === pid
            );
            if (exists) return prev;
            const name = p.user
              ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim()
              : `Peer ${pid.slice(0, 5)}`;
            return [
              ...prev,
              {
                id: pid,
                name: name || `Peer ${pid.slice(0, 5)}`,
                user: p.user,
                isHost: !!p.isHost,
              },
            ];
          });
        });

        client.on('participant-left', ({ participantId: leftPid }) => {
          setParticipants((prev) =>
            prev.filter((item) =>
              typeof item === 'string' ? item !== leftPid : item.id !== leftPid
            )
          );
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[leftPid];
            return next;
          });
        });

        client.on('meeting-ended', ({ reason }) => {
          setMeetingEndedReason(reason || 'The host has ended the meeting.');
          setStatus('ended');
        });

        client.on('remote-stream-updated', ({ participantId: pid, stream: remoteStream }) => {
          setRemoteStreams((prev) => ({
            ...prev,
            [pid]: remoteStream,
          }));
          setParticipants((prev) => {
            const exists = prev.some((item) =>
              typeof item === 'string' ? item === pid : item.id === pid
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                id: pid,
                name: `Peer ${pid.slice(0, 5)}`,
                user: null,
                isHost: false,
              },
            ];
          });
        });

        // Join room and setup transports
        const userPayload = user
          ? {
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
            }
          : null;

        const joinRes = await client.join({
          signalingUrl,
          token,
          roomId: targetRoomId,
          user: userPayload,
        });

        setParticipantId(joinRes.participantId);
        setIsHost(!!joinRes.isHost);

        if (Array.isArray(joinRes.participants)) {
          const formatted = joinRes.participants.map((p) => ({
            id: p.id,
            name: p.user
              ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim()
              : `Peer ${p.id.slice(0, 5)}`,
            user: p.user,
            isHost: !!p.isHost,
          }));
          setParticipants(formatted);
        }

        // Publish local tracks
        if (stream) {
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack && initialMic) {
            audioTrack.enabled = true;
            await client.produceTrack(audioTrack);
          }

          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack && initialCamera) {
            videoTrack.enabled = true;
            await client.produceTrack(videoTrack);
          }
        }

        setStatus('connected');
      } catch (err) {
        console.error('Failed to join meeting:', err);
        setError(err.message || 'Failed to join meeting');
        setStatus('error');
        throw err;
      }
    },
    [token, user]
  );

  const toggleMic = useCallback(async () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;

    const nextState = !isMicOn;
    track.enabled = nextState;
    setIsMicOn(nextState);

    const client = clientRef.current;
    if (client) {
      if (nextState) {
        try {
          await client.produceTrack(track);
        } catch (err) {
          console.error('Error re-producing audio:', err);
        }
      } else {
        client.stopProducing('audio');
      }
    }
  }, [localStream, isMicOn]);

  const toggleCamera = useCallback(async () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;

    const nextState = !isCameraOn;
    track.enabled = nextState;
    setIsCameraOn(nextState);

    const client = clientRef.current;
    if (client) {
      if (nextState) {
        try {
          await client.produceTrack(track);
        } catch (err) {
          console.error('Error re-producing video:', err);
        }
      } else {
        client.stopProducing('video');
      }
    }
  }, [localStream, isCameraOn]);

  const endMeeting = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.endMeeting();
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setStatus('idle');
    setRoomId(null);
    setParticipantId(null);
    setIsHost(false);
    setParticipants([]);
    setRemoteStreams({});
    setLocalStream(null);
  }, [localStream]);

  const leaveMeeting = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.leave();
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setStatus('idle');
    setRoomId(null);
    setParticipantId(null);
    setIsHost(false);
    setParticipants([]);
    setRemoteStreams({});
    setLocalStream(null);
  }, [localStream]);

  // Clean cleanup on component unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);

  const value = {
    status,
    roomId,
    participantId,
    isHost,
    meetingEndedReason,
    participants,
    remoteStreams,
    localStream,
    isMicOn,
    isCameraOn,
    error,
    user,
    joinMeeting,
    toggleMic,
    toggleCamera,
    leaveMeeting,
    endMeeting,
  };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}

export { MeetingContext };
