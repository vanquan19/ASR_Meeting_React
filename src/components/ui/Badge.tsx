export const Badge = ({
  variant,
  children,
  className,
}: {
  variant: "default" | "destructive";
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        variant === "default"
          ? "bg-gray-200 text-gray-800"
          : "bg-red-200 text-red-800"
      } ${className}`}
    >
      {children}
    </span>
  );
};
