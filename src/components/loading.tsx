"use client";
export const Loading = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"></div>
      </div>
    </div>
  );
};
