import React from 'react';

interface OpcionesBadge {
  variant?: 'success' | 'warning' | 'error' | 'default';
  children: React.ReactNode;
}

export function Badge({ children, variant = 'default' }: OpcionesBadge) {
  const variants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    default: "bg-card-bg text-text-muted border border-input-border"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}