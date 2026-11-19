import React, { useState, useEffect } from 'react';
import { systemService } from '../services/system.service.js';
import { Activity, Server } from 'lucide-react';
import '../styles/system.css';

export function HealthIndicator() {
  const [health, setHealth] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchHealth() {
      try {
        const data = await systemService.getHealth();
        if (isMounted) {
          setHealth(data);
          setIsError(false);
        }
      } catch {
        if (isMounted) setIsError(true);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="health-indicator-container">
      <button
        type="button"
        className="health-badge-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Server & SFU Health"
      >
        <span className={`health-dot ${isError ? 'dot-error' : 'dot-online'}`} />
        <span className="health-text">{isError ? 'Offline' : 'SFU Live'}</span>
      </button>

      {isOpen && (
        <>
          <div className="health-backdrop" onClick={() => setIsOpen(false)} />
          <div className="health-popover">
            <div className="health-popover-header">
              <Server size={14} />
              <span>System & SFU Diagnostics</span>
            </div>
            <div className="health-popover-body">
              <div className="health-stat-row">
                <span className="health-stat-label">Server Status:</span>
                <span className="health-stat-value font-mono">
                  {isError ? 'Unreachable' : health?.status || 'OK'}
                </span>
              </div>
              <div className="health-stat-row">
                <span className="health-stat-label">Active SFU Rooms:</span>
                <span className="health-stat-value font-mono">{health?.activeRooms ?? '-'}</span>
              </div>
              <div className="health-stat-row">
                <span className="health-stat-label">Uptime:</span>
                <span className="health-stat-value font-mono">
                  {health?.uptime !== undefined ? `${Math.floor(health.uptime)}s` : '-'}
                </span>
              </div>
              {health?.worker && (
                <div className="health-stat-row">
                  <span className="health-stat-label">Mediasoup Worker PID:</span>
                  <span className="health-stat-value font-mono">{health.worker.pid}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
