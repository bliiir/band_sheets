/**
 * ExportService.js
 * Service for handling the export and PDF generation functionality
 */
import { ENERGY_LINE_CONFIG } from './StyleService';
import { getTransposedChords } from './ChordService';
import { getAllSheets, getSheetById } from './SheetStorageService';
import { fetchWithAuth, API_URL } from './ApiService';
import { isAuthenticated as checkAuth, getAuthToken } from '../utils/AuthUtils';
import logger from './LoggingService';

/**
 * Calculate energy line width for PDF export
 * @param {number} energyLevel - Energy level (1-10)
 * @returns {string} - CSS width value
 */
const getEnergyWidthForPdf = (energyLevel) => {
  // Use the shared configuration from StyleService
  const maxPercentage = ENERGY_LINE_CONFIG.MAX_WIDTH_PERCENTAGE;
  
  if (energyLevel === 1) {
    // For energy level 1, we want to match the section column width
    return '80px'; // Matches the new section column width
  } else if (energyLevel === 10) {
    return `${maxPercentage}%`;
  } else {
    // Linear interpolation between min width and max percentage
    // For PDF, we convert min width (80px) to a percentage (approx 8%)
    const minWidthAsPercentage = 8; // 80px is roughly 8% of sheet width
    const percentage = minWidthAsPercentage + ((maxPercentage - minWidthAsPercentage) / 9) * (energyLevel - 1);
    return `${percentage}%`;
  }
};

/**
 * Generate print-friendly HTML content
 * @param {Object} songData - Contains title, artist, bpm
 * @param {Array} sections - All sections with their parts for the sheet
 * @param {Number} transposeValue - Current transpose value (optional)
 * @param {Array} partsModule - Chord progressions data
 * @param {Object} options - Export options
 * @param {Boolean} options.includeChordProgressions - Whether to include chord progressions on the last page
 * @param {Boolean} options.includeSectionColors - Whether to include section background colors
 * @returns {String} - HTML content for printing
 */
export const generatePrintContent = (songData, sections, transposeValue = 0, partsModule = [], options = {}) => {
  const { includeChordProgressions = true, includeSectionColors = true } = options;
  // Filter out placeholder text before exporting
  const processedSections = sections.map(section => ({
    ...section,
    parts: section.parts.map(part => ({
      ...part,
      // Don't export empty strings for lyrics and notes
      lyrics: part.lyrics || '',
      notes: part.notes || ''
    }))
  }));
  
  // Generate the print-friendly HTML
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${songData.title || 'Untitled'} - Band Sheet</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata&display=swap" rel="stylesheet">
        <style>
          @media print {
            .page-break {
              page-break-before: always;
            }
            button {
              display: none;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 10px;
          }
          h1 {
            font-size: 20px;
            margin: 0 20px 0 0;
            display: inline-block;
          }
          .meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #555;
          }
          /* Sheet container */
          .sheet-container {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
          }
          /* Sheet header row */
          .sheet-header {
            display: grid;
            grid-template-columns: 80px 48px 48px 1fr 12.5% auto;
            gap: 10px;
            padding: 5px 16px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
            font-size: 14px;
          }
          /* Section container */
          .section-container {
            display: flex;
            border-bottom: 1px solid #ddd;
            position: relative;
          }
          .section-container:last-child {
            border-bottom: none;
          }
          /* Section header */
          .section-header {
            width: 80px;
            min-width: 80px;
            padding: 8px 8px;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .section-name {
            font-weight: bold;
            font-size: 13px;
          }
          /* Energy indicator line */
          .energy-line {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 1px;
            background-color: black;
          }
          /* Parts container */
          .parts-container {
            flex: 1;
          }
          /* Part row */
          .part-row {
            display: grid;
            grid-template-columns: 48px 48px 1fr 12.5% auto;
            gap: 10px;
            padding: 5px 16px;
            border-bottom: 1px solid #eee;
            align-items: center;
          }
          .part-row:last-child {
            border-bottom: none;
          }
          /* Column styles */
          .lyrics {
            white-space: pre-line;
            line-height: 1.3;
            font-family: 'Inconsolata', monospace;
          }
          .notes {
            font-size: 11px;
            color: #666;
            line-height: 1.2;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="meta">
          <h1>${songData.title || 'Untitled'}</h1>
          ${songData.artist ? `<div><strong>Artist:</strong> ${songData.artist}</div>` : ''}
          ${songData.bpm ? `<div><strong>BPM:</strong> ${songData.bpm}</div>` : ''}
          ${transposeValue !== 0 ? `<div><strong>Transposed:</strong> ${transposeValue > 0 ? '+' + transposeValue : transposeValue} semitones</div>` : ''}
          <div class="no-print">
            <button onclick="window.print()" style="padding: 5px 10px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print PDF
            </button>
          </div>
        </div>
        
        <div class="sheet-container">
          <!-- Sheet header -->
          <div class="sheet-header">
            <div>Section</div>
            <div>Part</div>
            <div>Bars</div>
            <div>Lyrics</div>
            <div>Notes</div>
            <div><!-- Actions placeholder --></div>
          </div>
          
          <!-- Sections -->
          ${processedSections.map((section, index) => `
            <div class="section-container"${includeSectionColors && section.backgroundColor ? ` style="background-color: ${section.backgroundColor};"` : ''}>
              <!-- Energy indicator line that spans across the entire row -->
              <div style="position: absolute; bottom: 0; left: 0; height: ${ENERGY_LINE_CONFIG.HEIGHT}px; background-color: black; width: ${getEnergyWidthForPdf(section.energy)}; z-index: 1;"></div>
              
              <!-- Section header -->
              <div class="section-header">
                <div class="section-name">${section.name}</div>
              </div>
              
              <!-- Parts container -->
              <div class="parts-container">
                ${section.parts.map((part, pi) => `
                  <div class="part-row">
                    <div>${part.part}</div>
                    <div>${part.bars}</div>
                    <div class="lyrics">${part.lyrics}</div>
                    <div class="notes">${part.notes || ''}</div>
                    <div><!-- No actions in print view --></div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Last Page: Chord Progressions -->
        ${includeChordProgressions && partsModule && partsModule.length > 0 ? `
        <div class="page-break"></div>
        <div class="chord-progressions" style="min-height: 100vh; display: flex; flex-direction: column;">
          <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px;">Chord Progressions</h2>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
            <!-- Header row -->
            <div style="display: grid; grid-template-columns: 80px 60px 1fr 1fr; gap: 10px; padding: 8px 16px; background-color: #f8f8f8; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 14px;">
              <div>Part</div>
              <div>Bars</div>
              <div>Original Chords</div>
              <div>Transposed Chords</div>
            </div>
            
            <!-- Chord progression rows -->
            ${partsModule.map(part => `
              <div style="display: grid; grid-template-columns: 80px 60px 1fr 1fr; gap: 10px; padding: 8px 16px; border-bottom: 1px solid #eee;">
                <div style="font-weight: bold;">${part.part}</div>
                <div>${part.bars}</div>
                <div style="font-family: 'Inconsolata', monospace; white-space: pre;">${part.chords || ''}</div>
                <div style="font-family: 'Inconsolata', monospace; white-space: pre;">${part.chords ? getTransposedChords(part.chords, transposeValue) : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </body>
    </html>
  `;
  
};

/**
 * Generate and open a print-friendly version in a new tab
 * @param {Object} songData - Contains title, artist, bpm
 * @param {Array} sections - All sections with their parts for the sheet
 * @param {Number} transposeValue - Current transpose value (optional)
 * @param {Array} partsModule - Chord progressions data
 * @param {Object} options - Export options
 * @param {Boolean} options.includeChordProgressions - Whether to include chord progressions on the last page
 * @param {Boolean} options.includeSectionColors - Whether to include section background colors
 */
export const exportToPDF = (songData, sections, transposeValue = 0, partsModule = [], options = {}) => {
  // Create a new window/tab
  const printWindow = window.open('', '_blank');
  
  // Generate the print-friendly HTML
  const printContent = generatePrintContent(songData, sections, transposeValue, partsModule, options);
  
  // Write the content to the new window
  printWindow.document.write(printContent);
  printWindow.document.close();
};

/**
 * Load a sheet by ID and return the print content
 * @param {string} sheetId - ID of the sheet to print
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - Object containing print content and sheet data
 */
export const getPrintContentBySheetId = async (sheetId, options = {}) => {
  try {
    const sheet = await getSheetById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }
    
    const songData = {
      title: sheet.title || '',
      artist: sheet.artist || '',
      bpm: sheet.bpm || ''
    };
    
    const sections = sheet.sections || [];
    const partsModule = sheet.partsModule || [];
    const transposeValue = sheet.transposeValue || 0;
    
    const printContent = generatePrintContent(songData, sections, transposeValue, partsModule, options);
    
    return {
      printContent,
      sheet
    };
  } catch (error) {
    logger.error('ExportService', 'Error generating print content:', error);
    throw error;
  }
};

/**
 * Export a single sheet to a JSON file
 * @param {string} sheetId - ID of the sheet to export
 * @returns {Promise<Object>} Promise that resolves when export is complete
 */
export const exportSingleSheet = async (sheetId) => {
  try {
    // Get the sheet from storage
    const sheet = await getSheetById(sheetId);
    
    if (!sheet) {
      throw new Error(`Sheet with ID ${sheetId} not found`);
    }
    
    // Export the sheet directly (same format as localStorage)
    // This makes it consistent with the localStorage format
    const jsonData = JSON.stringify(sheet, null, 2);
    
    // Create a blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a safe filename based on the sheet title
    const safeTitle = sheet.title.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeTitle}_${sheet.id}.json`;
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return { success: true, message: `Sheet "${sheet.title}" exported successfully` };
  } catch (error) {
    logger.error('ExportService', 'Error exporting sheet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export all sheets to a JSON file
 * @returns {Promise<Object>} Promise that resolves when export is complete
 */
export const exportSheets = async () => {
  try {
    // Get all sheets from API or localStorage without triggering UI updates
    const sheetList = await getAllSheets(true, true); // sortByNewest=true, skipUIRefresh=true
    
    if (!sheetList || sheetList.length === 0) {
      throw new Error('No sheets found to export');
    }
    
    // Fetch the complete data for each sheet
    const completeSheets = [];
    const token = getAuthToken();
    const isAuthenticated = checkAuth();
    
    // For each sheet in the list, get its complete data
    for (const sheetInfo of sheetList) {
      try {
        let completeSheet;
        
        if (isAuthenticated && API_URL) {
          // Get complete sheet data from API
          try {
            const response = await fetchWithAuth(`${API_URL}/sheets/${sheetInfo.id}`);
            completeSheet = response.data;
          } catch (error) {
            logger.error('ExportService', `Error fetching complete data for sheet ${sheetInfo.id}:`, error);
            // Try localStorage as fallback
            const localData = localStorage.getItem(`sheet_${sheetInfo.id}`);
            if (localData) {
              completeSheet = JSON.parse(localData);
            }
          }
        } else {
          // Get from localStorage
          const localData = localStorage.getItem(`sheet_${sheetInfo.id}`);
          if (localData) {
            completeSheet = JSON.parse(localData);
          }
        }
        
        if (completeSheet) {
          completeSheets.push(completeSheet);
        }
      } catch (error) {
        logger.error('ExportService', `Error processing sheet ${sheetInfo.id}:`, error);
      }
    }
    
    if (completeSheets.length === 0) {
      throw new Error('Failed to retrieve complete data for any sheets');
    }
    
    // Create export object with metadata
    const exportData = {
      exportDate: new Date(),
      sheetsCount: completeSheets.length,
      sheets: completeSheets
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `band_sheets_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: `${completeSheets.length} sheets exported successfully`
    };
  } catch (error) {
    logger.error('ExportService', 'Export failed:', error);
    throw error;
  }
};

/**
 * Generate and open a combined print-friendly version of multiple sheets in a new tab
 * @param {Array} sheets - Array of sheet objects to include in the PDF
 * @param {Object} setlistInfo - Information about the setlist (name, description)
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export const exportMultipleSheetsToPDF = async (sheets, setlistInfo, options = {}) => {
  if (!sheets || sheets.length === 0) {
    throw new Error('No sheets provided for export');
  }

  // Create a new window/tab
  const printWindow = window.open('', '_blank');
  
  // Start with a basic HTML structure
  let combinedContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${setlistInfo.name || 'Setlist'} - Band Sheets</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata&display=swap" rel="stylesheet">
        <style>
          @media print {
            .page-break {
              page-break-before: always;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 10px;
          }
          .setlist-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .setlist-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .setlist-description {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
          }
          h1 {
            font-size: 20px;
            margin: 0 20px 0 0;
            display: inline-block;
          }
          .meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #555;
          }
          /* Sheet container */
          .sheet-container {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
            margin-bottom: 50px;
          }
          
          /* Sheet separator - visual indicator between sheets */
          .sheet-separator {
            border-bottom: 2px dashed #ccc;
            margin: 30px 0 60px 0;
            padding-bottom: 20px;
          }
          /* Sheet header row */
          .sheet-header {
            display: grid;
            grid-template-columns: 80px 48px 48px 1fr 12.5% auto;
            gap: 10px;
            padding: 5px 16px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
            font-size: 14px;
          }
          /* Section container */
          .section-container {
            display: flex;
            border-bottom: 1px solid #ddd;
            position: relative;
          }
          .section-container:last-child {
            border-bottom: none;
          }
          /* Section header */
          .section-header {
            width: 80px;
            min-width: 80px;
            padding: 8px 8px;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .section-name {
            font-weight: bold;
            font-size: 13px;
          }
          /* Energy indicator line */
          .energy-line {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background-color: black;
          }
          /* Parts container */
          .parts-container {
            flex: 1;
          }
          /* Part row */
          .part-row {
            display: grid;
            grid-template-columns: 48px 48px 1fr 12.5% auto;
            gap: 10px;
            padding: 5px 16px;
            border-bottom: 1px solid #eee;
            align-items: center;
          }
          .part-row:last-child {
            border-bottom: none;
          }
          /* Column styles */
          .lyrics {
            white-space: pre-line;
            line-height: 1.3;
            font-family: 'Inconsolata', monospace;
          }
          .notes {
            font-size: 11px;
            color: #666;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="setlist-header">
          <div class="setlist-title">${setlistInfo.name || 'Untitled Setlist'}</div>
          ${setlistInfo.description ? `<div class="setlist-description">${setlistInfo.description}</div>` : ''}
          <div class="no-print">
            <button onclick="window.print()" style="padding: 5px 10px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print PDF
            </button>
          </div>
        </div>
  `;

  // Process each sheet
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (!sheet) continue;

    try {
      // Extract data needed for print content
      const songData = {
        title: sheet.title || '',
        artist: sheet.artist || '',
        bpm: sheet.bpm || ''
      };
      
      const sections = sheet.sections || [];
      const partsModule = sheet.partsModule || [];
      const transposeValue = sheet.transposeValue || 0;
      
      // Generate content without the HTML wrapper (we'll use our own)
      const { printContent } = await generateSheetContent(songData, sections, transposeValue, partsModule, options);
      
      // Add a page break before each sheet (except the first one)
      if (i > 0) {
        combinedContent += '<div class="page-break"></div>';
      }
      
      // Add the sheet content
      combinedContent += printContent;
      
      // Add a visual separator after each sheet (except the last one)
      if (i < sheets.length - 1) {
        combinedContent += '<div class="sheet-separator"></div><div class="no-print">Next sheet: ' + (sheets[i+1].title || 'Untitled') + '</div>';
      }
    } catch (error) {
      logger.error('ExportService', `Error processing sheet ${sheet.id || i}:`, error);
      // Continue with other sheets even if one fails
    }
  }

  // Close the HTML document
  combinedContent += `
      </body>
    </html>
  `;
  
  // Write the content to the new window
  printWindow.document.write(combinedContent);
  printWindow.document.close();
};

/**
 * Generate content for a single sheet without the full HTML wrapper
 * Helper function for exportMultipleSheetsToPDF
 */
const generateSheetContent = (songData, sections, transposeValue = 0, partsModule = [], options = {}) => {
  const { includeChordProgressions = true, includeSectionColors = true } = options;
  // Filter out placeholder text before exporting
  const processedSections = sections.map(section => ({
    ...section,
    parts: section.parts.map(part => ({
      ...part,
      // Don't export empty strings for lyrics and notes
      lyrics: part.lyrics || '',
      notes: part.notes || ''
    }))
  }));
  
  // Generate just the sheet content without the HTML document wrapper
  const printContent = `
    <div class="meta">
      <h1>${songData.title || 'Untitled'}</h1>
      ${songData.artist ? `<div><strong>Artist:</strong> ${songData.artist}</div>` : ''}
      ${songData.bpm ? `<div><strong>BPM:</strong> ${songData.bpm}</div>` : ''}
      ${transposeValue !== 0 ? `<div><strong>Transposed:</strong> ${transposeValue > 0 ? '+' + transposeValue : transposeValue} semitones</div>` : ''}
    </div>
    
    <div class="sheet-container" style="padding-bottom: 20px;">
      <!-- Sheet header -->
      <div class="sheet-header">
        <div>Section</div>
        <div>Part</div>
        <div>Chords</div>
        <div>Lyrics</div>
        <div>Key Parts</div>
        <div>Notes</div>
      </div>

      <!-- Sections -->
      ${processedSections.map(section => `
        <div class="section-container" ${includeSectionColors && section.backgroundColor ? `style="background-color: ${section.backgroundColor}"` : ''}>
          <div class="section-header">
            <div class="section-name">${section.name || ''}</div>
            ${section.energyLevel ? `<div class="energy-line" style="width: ${getEnergyWidthForPdf(section.energyLevel)}"></div>` : ''}
          </div>
          <div class="parts-container">
            ${section.parts.map(part => `
              <div class="part-row">
                <div>${part.name || ''}</div>
                <div style="font-family: 'Inconsolata', monospace;">${transposeValue !== 0 ? getTransposedChords(part.chords, transposeValue) : (part.chords || '')}</div>
                <div class="lyrics">${part.lyrics || ''}</div>
                <div>${part.keyParts || ''}</div>
                <div class="notes">${part.notes || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add chord progressions on page 2 if requested
  let chordProgressionsContent = '';
  if (includeChordProgressions && partsModule && partsModule.length > 0) {
    // Only include parts with chord progressions
    const partsWithProgressions = partsModule.filter(part => part.chords && part.chords.trim().length > 0);
    
    if (partsWithProgressions.length > 0) {
      chordProgressionsContent = `
        <div class="page-break"></div>
        <h2>Chord Progressions</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: 'Inconsolata', monospace;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Part</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Original Chords</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Transposed Chords (${transposeValue > 0 ? '+' + transposeValue : transposeValue})</th>
            </tr>
          </thead>
          <tbody>
            ${partsWithProgressions.map(part => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${part.name || ''}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${part.chords || ''}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${transposeValue !== 0 ? getTransposedChords(part.chords, transposeValue) : (part.chords || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }
  
  return { printContent: printContent + chordProgressionsContent, processedSections };
};

/**
 * Export a single sheet to PDF by its ID
 * @param {string} sheetId - ID of the sheet to export
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - Object with success/error info
 */
export const exportSheetToPDF = async (sheetId, options = {}) => {
  try {
    const { printContent } = await getPrintContentBySheetId(sheetId, options);
    
    // Create a new window/tab
    const printWindow = window.open('', '_blank');
    
    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    return { success: true };
  } catch (error) {
    logger.error('ExportService', 'Error exporting sheet to PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export all sheets in a setlist as a single PDF
 * @param {string} setlistId - ID of the setlist to export
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - Object with success/error info
 */
export const exportSetlistToPDF = async (setlistId, options = {}) => {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { getSetlistById } = await import('./SetlistService');
    
    // Get the setlist data
    const setlist = await getSetlistById(setlistId);
    if (!setlist) {
      throw new Error('Setlist not found');
    }
    
    if (!setlist.sheets || setlist.sheets.length === 0) {
      throw new Error('This setlist does not contain any sheets');
    }
    
    // Load the full data for each sheet
    const fullSheets = [];
    for (const sheetInfo of setlist.sheets) {
      try {
        const sheet = await getSheetById(sheetInfo.id);
        if (sheet) {
          fullSheets.push(sheet);
        }
      } catch (error) {
        logger.error('ExportService', `Error loading sheet ${sheetInfo.id}:`, error);
        // Continue with other sheets
      }
    }
    
    if (fullSheets.length === 0) {
      throw new Error('Could not load any sheets in this setlist');
    }
    
    // Create setlist info object
    const setlistInfo = {
      name: setlist.name || 'Untitled Setlist',
      description: setlist.description || ''
    };
    
    // Generate the PDF with all sheets
    await exportMultipleSheetsToPDF(fullSheets, setlistInfo, options);
    
    return { success: true, message: `${fullSheets.length} sheets exported successfully` };
  } catch (error) {
    logger.error('ExportService', 'Error exporting setlist to PDF:', error);
    return { success: false, error: error.message };
  }
};

// Named exports only
// No default export to avoid ESLint warning
