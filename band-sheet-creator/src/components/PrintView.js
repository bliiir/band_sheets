import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPrintContentBySheetId } from '../services/ExportService';

/**
 * PrintView component for displaying a print-friendly version of a sheet
 * This component is used when directly accessing the print URL
 */
const PrintView = () => {
  const { sheetId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printContent, setPrintContent] = useState('');
  
  useEffect(() => {
    const fetchPrintContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Default options - can be extended to support URL parameters for customization
        const options = {
          includeChordProgressions: true,
          includeSectionColors: true
        };
        
        const result = await getPrintContentBySheetId(sheetId, options);
        setPrintContent(result.printContent);
        
        // Auto-trigger print dialog after content is loaded
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err) {
        console.error('Error loading print content:', err);
        setError(err.message || 'Failed to load sheet for printing');
      } finally {
        setLoading(false);
      }
    };
    
    if (sheetId) {
      fetchPrintContent();
    } else {
      setError('No sheet ID provided');
      setLoading(false);
    }
  }, [sheetId]);
  
  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Preparing print view...</p>
        </div>
      </div>
    );
  }
  
  // If there was an error, show an error message
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Render the print content using dangerouslySetInnerHTML
  // This is safe because we're generating the HTML ourselves in ExportService
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: printContent }} 
      className="print-view"
    />
  );
};

export default PrintView;
