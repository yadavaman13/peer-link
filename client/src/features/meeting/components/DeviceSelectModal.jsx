import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/Modal.jsx';
import { Button } from '../../shared/components/Button.jsx';

export function DeviceSelectModal({
  isOpen,
  onClose,
  audioDevices = [],
  videoDevices = [],
  selectedAudioId,
  selectedVideoId,
  onSelectDevices,
}) {
  const [currentAudio, setCurrentAudio] = useState(selectedAudioId);
  const [currentVideo, setCurrentVideo] = useState(selectedVideoId);

  useEffect(() => {
    setCurrentAudio(selectedAudioId);
    setCurrentVideo(selectedVideoId);
  }, [selectedAudioId, selectedVideoId, isOpen]);

  function handleSave() {
    onSelectDevices({ audioId: currentAudio, videoId: currentVideo });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audio & Video Settings"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleSave}>
            Apply Settings
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label htmlFor="settings-mic" className="input-label">
            Microphone Source
          </label>
          <select
            id="settings-mic"
            className="input-field"
            value={currentAudio}
            onChange={(e) => setCurrentAudio(e.target.value)}
          >
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="settings-camera" className="input-label">
            Camera Source
          </label>
          <select
            id="settings-camera"
            className="input-field"
            value={currentVideo}
            onChange={(e) => setCurrentVideo(e.target.value)}
          >
            {videoDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
