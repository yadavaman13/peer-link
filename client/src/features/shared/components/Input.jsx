import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/shared.css';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    id,
    type = 'text',
    className = '',
    required = false,
    rightElement,
    showPasswordToggle = type === 'password',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  let adornment = rightElement;
  if (!adornment && isPassword && showPasswordToggle) {
    adornment = (
      <button
        type="button"
        className="input-adornment-btn"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    );
  }

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          required={required}
          className={`input-field ${adornment ? 'input-with-right-element' : ''} ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {adornment && <div className="input-right-element">{adornment}</div>}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
});
