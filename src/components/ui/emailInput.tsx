// components/ui/EmailInput.tsx

import { EmailInputProps } from "@/types/components/emailInput.types";

const EmailInput = ({
  icon,
  className = "",
  placeholder = "Enter your email",
  ...props
}: EmailInputProps) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type="email"
        className={`w-full rounded-md border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${icon ? 'pl-10' : ''} ${className}`}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default EmailInput;