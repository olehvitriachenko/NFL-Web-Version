interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) => {
  const baseClasses =
    'px-6 py-3.5 text-base font-semibold transition-all uppercase tracking-wide';
  const variantClasses =
    variant === 'primary'
      ? 'bg-[#0D175C] text-white hover:bg-[#39458C] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
      : 'bg-white text-[#0D175C] border border-gray-300 hover:bg-gray-50';
  
  const borderRadius = '10px';
  const widthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${widthClasses} ${disabledClasses} ${className}`}
      style={{ borderRadius }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
