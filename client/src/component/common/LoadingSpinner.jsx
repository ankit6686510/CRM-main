import React from "react";

const LoadingSpinner = ({ label = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {/* Inner dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 bg-blue-600 rounded-full animate-pulse"></div>
      </div>
      <p className="mt-6 text-blue-700 font-medium text-lg">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
