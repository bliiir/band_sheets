import React, { useRef, useEffect } from 'react';
import { useUIState } from '../contexts/UIStateContext';

/**
 * ContextMenu component for displaying contextual actions
 * Uses UIStateContext for state management instead of props
 * 
 * @param {Object} props - Component props
 * @param {Array} props.menuItems - Array of menu item objects with label, action, and optional disabled/danger props
 */
const ContextMenu = ({ menuItems = [] }) => {
  // Get context menu state from UIStateContext
  const { contextMenu, hideContextMenu } = useUIState();
  const { visible, x, y } = contextMenu || {};
  
  // Use hideContextMenu from UIStateContext as the onClose handler
  const onClose = hideContextMenu;
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
  
  // Debug logging to see what items are being passed
  console.log('ContextMenu rendering with items:', menuItems);
  console.log('ContextMenu state:', { visible, x, y, contextType: contextMenu.type, sectionIndex: contextMenu.si, partIndex: contextMenu.pi });

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded shadow-lg z-[1000] min-w-[160px] py-1"
      style={{
        top: y,
        left: x
      }}
    >
      {menuItems.length === 0 ? (
        <div className="px-4 py-2 italic text-gray-500">No actions available</div>
      ) : (
        menuItems.map((item, index) => (
          <div
            key={index}
            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              item.danger ? 'text-red-500' : ''
            }`}
            onClick={(e) => {
              // Debug logging when an item is clicked
              console.log(`ContextMenu item clicked: ${item.label}`);
              e.stopPropagation(); // Prevent event bubbling
              if (!item.disabled && item.action) {
                console.log(`Executing action for: ${item.label}`);
                try {
                  item.action();
                  console.log(`Action executed successfully for: ${item.label}`);
                } catch (error) {
                  console.error(`Error executing action for ${item.label}:`, error);
                }
                onClose();
              }
            }}
          >
            {item.label}
          </div>
        ))
      )}
    </div>
  );
};

export default ContextMenu;
