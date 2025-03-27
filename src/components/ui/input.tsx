import * as React from "react";

import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input  px-3 py-2 text-sm  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:ouline-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
import { Search } from "lucide-react";

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

export { Input };
