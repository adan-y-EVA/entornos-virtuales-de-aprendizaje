import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-secondary transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-opacity-90 border border-transparent",
    secondary: "bg-secondary text-white hover:bg-opacity-90 border border-transparent",
    outline: "border border-input-border text-text-main hover:bg-card-bg",
    ghost: "text-primary hover:bg-blue-50 border border-transparent hover:border-blue-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs space-x-1",
    md: "px-4 py-2 text-sm space-x-2",
    lg: "px-6 py-3 text-base space-x-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}