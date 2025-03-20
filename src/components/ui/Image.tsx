export const Avatar = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white ${className}`}
    >
      {children}
    </div>
  );
};

export const AvatarFallback = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 text-gray-500 ${className}`}
    >
      {children}
    </div>
  );
};
