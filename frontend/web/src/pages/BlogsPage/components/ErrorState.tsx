/**
 * Error state component for blog content
 * Shows when API requests fail
 */

import React from 'react';

interface ErrorStateProps {
  message?: string;
}

/**
 * Error state with customizable message
 */
const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Failed to load articles' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        padding: '40px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: '16px',
          opacity: 0.3
        }}
      >
        ⚠️
      </div>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#d32f2f',
          margin: 0
        }}
      >
        {message}
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#8a8a8a',
          marginTop: '8px'
        }}
      >
        Please try again later
      </p>
    </div>
  );
};

export default ErrorState;
