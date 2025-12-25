interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

export const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  error,
}: FormFieldProps) => {
  return (
    <div className="mb-6">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[#6e6e73] mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 text-base text-[#1d1d1f] bg-white border rounded-lg transition-all focus:outline-none focus:border-[#1e40af] focus:ring-4 focus:ring-[#1e40af]/10 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
            : 'border-[#d2d2d7]'
        } placeholder:text-[#6e6e73]`}
      />
      {error && (
        <span className="block text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  );
};
