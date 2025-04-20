import React from 'react';
import ReactDOM from 'react-dom';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "red" // blue, red, green
}) => {
  if (!isOpen) return null;
  
  // Map color to Tailwind classes
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
  };
  
  const confirmClass = colorMap[confirmColor] || colorMap.blue;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
        )}
        
        {/* Modal content */}
        <div className="px-6 py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        
        {/* Modal actions */}
        <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
          <button
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 text-white ${confirmClass} rounded transition-colors`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
