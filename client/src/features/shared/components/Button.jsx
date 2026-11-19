import React from 'react';
import '../styles/shared.css';

export function Button({
  children,
  variant = 'solid', // solid | outline | ghost | danger | danger-outline
  size = 'md', // sm | md | lg
  isIcon = false,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, isIcon ? 'btn-icon' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span
          className="btn-spinner"
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : null}
      {children}
    </button>
  );
}
