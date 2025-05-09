
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <img 
      src="/lovable-uploads/6eb0aed6-56e7-4955-a53b-6ec851b390d2.png" 
      alt="Water 4 WeightLoss Logo" 
      className={className} 
    />
  );
};

export default Logo;
