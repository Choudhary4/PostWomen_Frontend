import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary', text = '' }) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size];

  const colorClass = {
    primary: 'spinner-primary',
    white: 'spinner-white',
    gray: 'spinner-gray'
  }[color];

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${sizeClass} ${colorClass}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;