import React from 'react';
import { X, User } from 'lucide-react';
import { Button } from '../../shared/components/Button.jsx';
import { shortId } from '../../shared/utils/formatters.js';
import '../styles/meeting.css';

export function ParticipantsDrawer({
  isOpen,
  onClose,
  localUser,
  isHost = false,
  participants = [],
}) {
  if (!isOpen) return null;

  return (
    <aside className="meeting-drawer" aria-label="Meeting participants">
      <div className="drawer-header">
        <h2 className="drawer-title">Participants ({1 + participants.length})</h2>
        <Button variant="ghost" size="sm" isIcon onClick={onClose} aria-label="Close drawer">
          <X size={16} />
        </Button>
      </div>

      <div className="drawer-body">
        {/* Local user entry */}
        <div className="participant-list-item">
          <div className="participant-info">
            <div className="participant-avatar-sm">{localUser?.firstName?.[0] || 'U'}</div>
            <div>
              <div style={{ fontWeight: 500 }}>
                {localUser ? `${localUser.firstName} ${localUser.lastName}` : 'You'} (You)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isHost ? 'Host / Local' : 'Participant / Local'}
              </div>
            </div>
          </div>
        </div>

        {/* Remote participants */}
        {participants.map((p) => {
          const pid = typeof p === 'string' ? p : p.id;
          const displayName =
            typeof p === 'object' && p.name ? p.name : `Peer ${shortId(pid, 6, 4)}`;
          const initial =
            typeof p === 'object' && p.user?.firstName
              ? p.user.firstName[0].toUpperCase()
              : displayName[0]?.toUpperCase() || 'P';
          const isRemoteHost = typeof p === 'object' ? !!p.isHost : false;

          return (
            <div key={pid} className="participant-list-item">
              <div className="participant-info">
                <div
                  className="participant-avatar-sm"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  {initial}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{displayName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {isRemoteHost ? 'Host' : 'Participant'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
