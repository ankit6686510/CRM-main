import React, { useState } from "react";

// Tooltip component
const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-[var(--text-black-900)] bg-[var(--bg-black-50)] rounded-md shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
