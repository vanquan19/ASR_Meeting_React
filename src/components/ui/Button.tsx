export function Button({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-4 py-4 md:cursor-pointer text-base rounded-full font-semibold transition bg-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
