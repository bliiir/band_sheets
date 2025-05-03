import React from 'react';
import { useParams } from 'react-router-dom';
import BandSheetEditor from '../components/BandSheetEditor';

/**
 * Page component for editing a sheet.
 * This is a wrapper around the existing BandSheetEditor component
 * to integrate it with our new design system.
 * 
 * According to memory 3a629140-2109-41a9-96ac-99916dec9dde, we need to
 * make sure the BandSheetEditor has a key prop tied to the sheet ID
 * to force a full remount when the sheet changes.
 */
const SheetEditorPage = () => {
  const { sheetId } = useParams();
  
  return (
    <div className="max-w-full mx-auto -m-4">
      <BandSheetEditor 
        initialSheetId={sheetId} 
        key={`sheet-${sheetId}`} 
      />
    </div>
  );
};

export default SheetEditorPage;
