import { Search } from "lucide-react";
export function Input({
  type,
  placeholder,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`border border-gray-300 rounded-full px-4 py-3 w-full text-xl outline-none focus:border-gray-500 transition-all ${className}`}
      {...props}
    />
  );
}

export function SearchInput({
  placeholder,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full my-auto">
      <Search className="absolute top-1/2 left-4 transform -translate-y-1/2" />
      <input
        type="text"
        placeholder={placeholder}
        className={`border border-gray-300 rounded-lg px-12 py-2 w-full text-base outline-none focus:border-gray-500 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
