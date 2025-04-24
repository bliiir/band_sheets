/**
 * ExportService.js
 * Service for handling the export and PDF generation functionality
 */
import { ENERGY_LINE_CONFIG } from './StyleService';
import { getTransposedChords } from './ChordService';

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
 * Generate and open a print-friendly version in a new tab
 * @param {Object} songData - Contains title, artist, bpm
 * @param {Array} sections - All sections with their parts for the sheet
 * @param {Number} transposeValue - Current transpose value (optional)
 * @param {Array} partsModule - Chord progressions data
 * @param {Object} options - Export options
 * @param {Boolean} options.includeChordProgressions - Whether to include chord progressions on page 2
 * @param {Boolean} options.includeSectionColors - Whether to include section background colors
 */
export const exportToPDF = (songData, sections, transposeValue = 0, partsModule = [], options = {}) => {
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
  
  // Create a new window/tab
  const printWindow = window.open('', '_blank');
  
  // Generate the print-friendly HTML
  const printContent = `
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
            button {
              display: none;
            }
            .no-print {
              display: none;
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
        
        <!-- Page 2: Chord Progressions -->
        ${includeChordProgressions && partsModule && partsModule.length > 0 ? `
        <div class="page-break"></div>
        <div class="chord-progressions">
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
  
  // Write the content to the new window
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Automatically trigger print when content is loaded
  printWindow.onload = function() {
    // Give a moment for styles to apply
    setTimeout(() => {
      // printWindow.print();
      // Keep the window/tab open for the user to manually print
    }, 250);
  };
};

// Named exports only
// No default export to avoid ESLint warning
