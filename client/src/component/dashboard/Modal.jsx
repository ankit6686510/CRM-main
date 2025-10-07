import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  blurBackground = true,
}) => {
  useEffect(() => {
    // Disable scrolling when modal is open
   
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay - only blur if specified */}
      <div
        className={`fixed inset-0 transition-opacity ${
          blurBackground ? "backdrop-blur-sm" : ""
        }`}
        aria-hidden="true"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-[var(--bg-black-900)] opacity-75"></div>
      </div>

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`relative bg-[var(--bg-black-100)] rounded-lg shadow-xl transform transition-all w-full ${sizeClasses[size]} mx-auto`}
          onClick={(e) => e.stopPropagation()} // Prevent click-through
        >
          {/* Modal header */}
          <div className="px-4 py-3 border-b border-[var(--bg-black-50)] flex justify-between items-center">
            <h3 className="text-lg font-medium text-[var(--text-black-900)]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--text-black-700)] hover:text-[var(--skin-color)] focus:outline-none"
              aria-label="Close modal"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Modal content */}
          <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
