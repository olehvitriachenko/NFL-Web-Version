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
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-600 mb-2"
      >
        {label} {required && <span className="text-[#D32F2F]">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{ borderRadius: 10 }}
        className={`w-full px-4 py-3 text-base text-[#000000] bg-white border transition-all focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 ${
          error
            ? 'border-[#D32F2F] focus:border-[#D32F2F] focus:ring-[#D32F2F]/10'
            : 'border-gray-300'
        } placeholder:text-gray-500`}
      />
      {error && (
        <span className="block text-xs text-[#D32F2F] mt-1">{error}</span>
      )}
    </div>
  );
};
