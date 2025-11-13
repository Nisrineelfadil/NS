import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  glass = false,
  onClick,
  ...props 
}) => {
  return (
    <div
      className={`card-modern ${hover ? 'card-hover' : ''} ${glass ? 'card-glass' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
