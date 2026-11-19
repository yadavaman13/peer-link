import React from 'react';
import '../styles/shared.css';

export function Badge({
  children,
  variant = 'default', // default | success | danger
  dot = false,
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
