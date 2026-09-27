'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 font-secondary text-sm font-semibold text-text-main"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`w-full px-4 py-2 bg-white border rounded-lg font-secondary text-sm text-text-main placeholder:text-text-muted transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${
            error ? 'border-secondary' : 'border-input-border'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 font-secondary text-xs text-secondary">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
