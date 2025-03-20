export function CardContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-4 grid-cols-2 bg-white lg:p-8 p-4 rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  cardKey,
}: {
  children: React.ReactNode;
  className?: string;
  cardKey?: string;
}) {
  return (
    <div
      key={cardKey}
      className={`bg-white p-4 shadow-md rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h2 className={`text-base font-semibold ${className}`}>{children}</h2>;
}

export function CardParagraph({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={`text-gray-500 ${className}`}>{children}</p>;
}

export function CardNote({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl max-w-96 p-3 pr-12 ${className}`}>
      <div className="absolute top-2 right-2 w-3 h-3 bg-gray-900 flex items-center justify-center rounded-full"></div>
      {children}
    </div>
  );
}
