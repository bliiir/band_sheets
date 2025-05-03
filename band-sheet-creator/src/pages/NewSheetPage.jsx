import React from 'react';
import BandSheetEditor from '../components/BandSheetEditor';

/**
 * Page component for creating a new sheet.
 * This is a wrapper around the existing BandSheetEditor component
 * with no initialSheetId.
 */
const NewSheetPage = () => {
  return (
    <div className="max-w-full mx-auto -m-4">
      <BandSheetEditor />
    </div>
  );
};

export default NewSheetPage;
