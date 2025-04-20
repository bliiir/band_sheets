/**
 * ExportService.js
 * Service for handling the export and PDF generation functionality
 */

/**
 * Generate and open a print-friendly version in a new tab
 * @param {Object} songData - Contains title, artist, bpm
 * @param {Array} sections - All sections with their parts for the sheet
 * @param {Number} transposeValue - Current transpose value (optional)
 */
export const exportToPDF = (songData, sections, transposeValue = 0) => {
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
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 5px;
          }
          .meta {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            font-size: 14px;
            color: #555;
          }
          /* Sheet container */
          .sheet-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }
          /* Sheet header row */
          .sheet-header {
            display: grid;
            grid-template-columns: 120px 60px 60px 1fr 12.5% auto;
            gap: 10px;
            padding: 8px 16px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
            font-size: 14px;
          }
          /* Section container */
          .section-container {
            display: flex;
            border-bottom: 1px solid #ddd;
          }
          .section-container:last-child {
            border-bottom: none;
          }
          /* Section header */
          .section-header {
            width: 120px;
            min-width: 120px;
            padding: 12px 8px;
            background-color: #f0f0f0;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .section-name {
            font-weight: bold;
          }
          .section-energy {
            font-size: 12px;
            margin-top: 8px;
            color: #666;
          }
          /* Parts container */
          .parts-container {
            flex: 1;
          }
          /* Part row */
          .part-row {
            display: grid;
            grid-template-columns: 60px 60px 1fr 12.5% auto;
            gap: 10px;
            padding: 8px 16px;
            border-bottom: 1px solid #eee;
            align-items: center;
          }
          .part-row:last-child {
            border-bottom: none;
          }
          /* Column styles */
          .lyrics {
            white-space: pre-line;
          }
          .notes {
            font-size: 12px;
            color: #666;
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
        <h1>${songData.title || 'Untitled'}</h1>
        <div class="meta">
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
          ${processedSections.map((section, si) => `
            <div class="section-container">
              <!-- Section header -->
              <div class="section-header">
                <div class="section-name">${section.name}</div>
                <div class="section-energy">Energy: ${section.energy}</div>
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
