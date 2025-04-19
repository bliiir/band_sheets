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
      style={{
        width: open ? 260 : 0,
        transition: 'width 0.2s',
        overflow: 'hidden',
        background: '#f8f8f8',
        borderRight: open ? '1px solid #ddd' : 'none',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="px-4 py-4 border-b border-gray-200 font-semibold flex items-center justify-between">
        Saved Sheets
        <button
          className="bg-none border-none text-2xl cursor-pointer hover:text-red-500 transition-colors"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      <div className="max-h-[calc(100vh-60px)] overflow-y-auto">
        {savedSheets.length === 0 && <div >No saved sheets</div>}
        {savedSheets.map(sheet => (
          <div
            key={sheet.id}
            style={{ padding: '12px 16px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
            onDoubleClick={() => onDoubleClickSheet(sheet.id)}
          >
            <div style={{ fontWeight: 500 }}>{sheet.title || '(Untitled)'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{sheet.artist || ''}</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>ID: {sheet.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
