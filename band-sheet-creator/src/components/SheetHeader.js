import React from 'react';

/**
 * SheetHeader component for displaying column headers in the band sheet
 * Hidden on mobile devices since Part component has its own labels
 */
const SheetHeader = () => {
  return (
    <div className="hidden md:flex border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
      <div className="w-[120px] min-w-[120px] px-4 py-2 flex items-center">Section</div>
      <div className="w-[60px] min-w-[60px] px-4 py-2 flex items-center">Part</div>
      <div className="w-[60px] min-w-[60px] px-2 py-2 flex items-center">Bars</div>
      <div className="flex-1 px-2 py-2 flex items-center">Lyrics</div>
      <div className="w-[200px] min-w-[200px] px-2 py-2 flex items-center">Notes</div>
      <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center"></div>
    </div>
  );
};

export default SheetHeader;
