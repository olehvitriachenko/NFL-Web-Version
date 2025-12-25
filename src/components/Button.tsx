interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}: ButtonProps) => {
  const baseClasses =
    'px-6 py-3.5 text-base font-semibold rounded-lg transition-all uppercase tracking-wide';
  const variantClasses =
    variant === 'primary'
      ? 'bg-[#1e40af] text-white hover:bg-[#1e3a8a] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
      : 'bg-white text-[#1e40af] border border-[#d2d2d7] hover:bg-[#f5f5f7]';
  const widthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${widthClasses} ${disabledClasses}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
