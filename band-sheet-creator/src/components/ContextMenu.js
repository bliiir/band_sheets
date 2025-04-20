import React, { useRef, useEffect } from 'react';

/**
 * ContextMenu component for displaying contextual actions
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the menu is visible
 * @param {number} props.x - X position of the menu
 * @param {number} props.y - Y position of the menu
 * @param {function} props.onClose - Function to call when the menu should close
 * @param {Array} props.menuItems - Array of menu item objects with label, action, and optional disabled/danger props
 */
const ContextMenu = ({ 
  visible, 
  x, 
  y, 
  onClose, 
  menuItems = []
}) => {
  const menuRef = useRef(null);
  const isNewRef = useRef(true);

  // Hide menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [visible, onClose]);

  // Handle menu positioning to ensure it stays within viewport
  useEffect(() => {
    const adjustMenuPosition = () => {
      if (menuRef.current && isNewRef.current && visible) {
        const menu = menuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 10; // Margin from viewport edges (px)
        
        let adjustedX = x;
        let adjustedY = y;
        
        // Check right edge
        if (menuRect.right > viewportWidth - margin) {
          adjustedX = viewportWidth - menuRect.width - margin;
        }
        
        // Check bottom edge
        if (menuRect.bottom > viewportHeight - margin) {
          adjustedY = viewportHeight - menuRect.height - margin;
        }
        
        // Check left edge
        if (adjustedX < margin) {
          adjustedX = margin;
        }
        
        // Check top edge
        if (adjustedY < margin) {
          adjustedY = margin;
        }
        
        // Update menu position if needed
        if (adjustedX !== x || adjustedY !== y) {
          menu.style.top = `${adjustedY}px`;
          menu.style.left = `${adjustedX}px`;
        }
        
        isNewRef.current = false;
      }
    };
    
    if (visible) {
      isNewRef.current = true;
      // Wait for the next frame to ensure the menu is rendered
      requestAnimationFrame(adjustMenuPosition);
    }
  }, [visible, x, y]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded shadow-lg z-[1000] min-w-[160px] py-1"
      style={{
        top: y,
        left: x
      }}
    >
      {menuItems.map((item, index) => (
        <div
          key={index}
          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
            item.disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            item.danger ? 'text-red-500' : ''
          }`}
          onClick={() => {
            if (!item.disabled && item.action) {
              item.action();
              onClose();
            }
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
