import { useState, useCallback, useRef } from 'react';

export function useMediaDevices() {
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [permissionError, setPermissionError] = useState(null);
  const streamRef = useRef(null);

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      if (audioInputs.length && !selectedAudioId) {
        setSelectedAudioId(audioInputs[0].deviceId);
      }
      if (videoInputs.length && !selectedVideoId) {
        setSelectedVideoId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate media devices:', err);
    }
  }, [selectedAudioId, selectedVideoId]);

  const startMedia = useCallback(
    async (audioSourceId, videoSourceId) => {
      // Stop old tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        audio: audioSourceId ? { deviceId: { exact: audioSourceId } } : true,
        video: videoSourceId
          ? { deviceId: { exact: videoSourceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setLocalStream(stream);
        setPermissionError(null);

        // Apply initial toggle state
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = isMicOn;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = isCameraOn;

        await getDevices();
        return stream;
      } catch (err) {
        console.warn('Initial media acquisition failed, attempting audio-only fallback:', err);
        // Fallback: If camera is locked by another tab/app, try audio-only
        if (constraints.video) {
          try {
            const audioOnlyConstraints = {
              audio: constraints.audio,
              video: false,
            };
            const audioStream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints);
            streamRef.current = audioStream;
            setLocalStream(audioStream);
            setIsCameraOn(false);
            setPermissionError(null);

            const audioTrack = audioStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = isMicOn;

            await getDevices();
            return audioStream;
          } catch (audioErr) {
            console.error('Audio-only fallback also failed:', audioErr);
          }
        }

        console.error('Error acquiring media stream:', err);
        setPermissionError(err.message || 'Media permission denied');
        return null;
      }
    },
    [isMicOn, isCameraOn, getDevices]
  );

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);
        return nextState;
      }
    }
    setIsMicOn((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsCameraOn(nextState);
        return nextState;
      }
    }
    setIsCameraOn((prev) => !prev);
  }, []);

  const changeAudioDevice = useCallback(
    async (deviceId) => {
      setSelectedAudioId(deviceId);
      return startMedia(deviceId, selectedVideoId);
    },
    [selectedVideoId, startMedia]
  );

  const changeVideoDevice = useCallback(
    async (deviceId) => {
      setSelectedVideoId(deviceId);
      return startMedia(selectedAudioId, deviceId);
    },
    [selectedAudioId, startMedia]
  );

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  return {
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
    stopAllTracks,
  };
}
