import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  color = '#667eea',
  centered = true 
}) => {
  const sizeClass = `spinner-${size}`;
  const containerClass = centered ? 'spinner-container centered' : 'spinner-container';

  return (
    <div className={containerClass}>
      <div className="spinner-content">
        <div 
          className={`spinner ${sizeClass}`}
          style={{ borderTopColor: color }}
        ></div>
        {message && (
          <p className="spinner-message">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;