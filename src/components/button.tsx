import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  
  // Estilos base de interacción y diseño
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

  // Mapeo exacto a tus variables de color corporativo de CRUMAFOOD
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-brand-blue text-white hover:bg-opacity-90',
    secondary: 'bg-brand-sand text-brand-black hover:bg-opacity-90',
    outline: 'border-2 border-brand-blue text-brand-blue bg-transparent hover:bg-brand-blue hover:text-white',
    dark: 'bg-brand-black text-white hover:bg-brand-gray-75'
  };

  // Escala de tamaños comerciales
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim();

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};