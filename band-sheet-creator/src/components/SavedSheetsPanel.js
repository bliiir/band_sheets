import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as MenuIcon } from '../assets/menu.svg';

export default function SavedSheetsPanel({
  open,
  savedSheets,
  onClose,
  onDoubleClickSheet,
  onUpdate
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef();
  const panelRef = useRef();

  // Helper to update a sheet's title in localStorage
  // Start inline editing for rename
  const handleRename = (sheet) => {
    setEditingId(sheet.id);
    setEditingValue(sheet.title || '');
    setMenuOpenId(null);
  };

  // Focus the input when editingId changes
  React.useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Commit rename
  const commitRename = (sheet) => {
    const newTitle = editingValue.trim();
    if (newTitle && newTitle !== sheet.title) {
      const updated = { ...sheet, title: newTitle };
      localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(updated));
      if (onUpdate) onUpdate();
    }
    setEditingId(null);
    setEditingValue('');
  };

  // Cancel rename
  const cancelRename = () => {
    setEditingId(null);
    setEditingValue('');
  };

  // Helper to delete a sheet from localStorage
  const handleDelete = (sheet) => {
    if (window.confirm('Delete this sheet?')) {
      localStorage.removeItem(`sheet_${sheet.id}`);
      if (onUpdate) onUpdate();
    }
    setMenuOpenId(null);
  };

  // Listen for storage changes to update the panel
  React.useEffect(() => {
    const update = () => {
      if (panelRef.current) panelRef.current.forceUpdate?.();
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  // Close menu on outside click, scroll, or resize
  React.useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menuOpenId]);

  // Render the menu as a portal
  const menuPortal = menuOpenId
    ? ReactDOM.createPortal(
        <div className="fixed bg-white border border-gray-300 rounded shadow-lg z-[9999]" style={{ left: menuPos.x, top: menuPos.y }}>
          <div
            className="px-4 py-2 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
            onClick={() => {
              const sheet = savedSheets.find(s => s.id === menuOpenId);
              if (sheet) handleRename(sheet);
            }}
          >Rename</div>
          <div
            className="px-4 py-2 cursor-pointer whitespace-nowrap text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              const sheet = savedSheets.find(s => s.id === menuOpenId);
              if (sheet) handleDelete(sheet);
            }}
          >Delete</div>
        </div>,
        document.body
      )
    : null;

  return (
    <div
      className={`h-full flex flex-col transition-all duration-200 overflow-hidden bg-white shadow-lg rounded-r-2xl ${open ? 'w-[260px] border-r border-gray-200' : 'w-0 border-none'} relative z-30`}
    >
      <div className="px-4 py-4 border-b border-gray-100 font-semibold flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm">
        <span className="tracking-wide text-lg text-gray-800">Saved Sheets</span>
        <button
          className="bg-transparent border-0 text-2xl cursor-pointer hover:text-red-500 transition-colors focus:outline-none p-1 rounded-full hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        {savedSheets.length === 0 && <div className="px-4 py-8 text-center text-gray-400 italic select-none">No saved sheets</div>}
        {savedSheets.map(sheet => (
          <div
            key={sheet.id}
            className="group px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2"
            onDoubleClick={() => onDoubleClickSheet(sheet.id)}
          >
            <div className="flex-1 min-w-0">
              {editingId === sheet.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingValue}
                  className="w-full font-medium text-base px-1 border-b border-blue-200 focus:border-blue-500 focus:bg-blue-50 outline-none bg-transparent transition-all rounded"
                  onChange={e => setEditingValue(e.target.value)}
                  onBlur={() => commitRename(sheet)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(sheet);
                    if (e.key === 'Escape') cancelRename();
                  }}
                />
              ) : (
                <div className="font-medium">
                  {sheet.title || '(Untitled)'}
                </div>
              )}
              <div className="text-xs text-gray-500">{sheet.artist || ''}</div>
              <div className="text-[11px] text-gray-400">ID: {sheet.id}</div>
            </div>
            <button
              className="bg-none border-none cursor-pointer p-1 ml-2 hover:bg-gray-200 rounded"
              onClick={e => {
                e.stopPropagation();
                if (menuOpenId === sheet.id) {
                  setMenuOpenId(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuOpenId(sheet.id);
                  setMenuPos({ x: rect.right, y: rect.bottom });
                }
              }}
              aria-label="Sheet menu"
            >
              <MenuIcon style={{ width: 20, height: 20, color: '#888' }} />
            </button>
          </div>
        ))}
      </div>
      {menuPortal}
    </div>
  );
}
