import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-slate-800 text-white shadow-lg hover:bg-slate-700 disabled:opacity-50",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};