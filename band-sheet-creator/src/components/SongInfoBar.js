import React from 'react';

/**
 * SongInfoBar component for editing song title, artist, and BPM
 * 
 * @param {Object} props - Component props
 * @param {Object} props.songData - Object containing title, artist, and bpm
 * @param {Function} props.setSongData - Function to update song data
 */
const SongInfoBar = ({ songData, setSongData }) => {
  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl shadow-sm sticky top-0 z-45">
      {/* Since SongInfoBar fields are always editable, we'll use a different approach than our typical EditableCell usage */}
      <div className="flex-1 min-w-[160px]">
        <input
          className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-semibold placeholder-gray-400"
          placeholder="Song Title"
          value={songData.title}
          onChange={e => setSongData((prev) => ({ ...prev, title: e.target.value }))}
          aria-label="Song Title"
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <input
          className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base placeholder-gray-400"
          placeholder="Artist"
          value={songData.artist}
          onChange={e => setSongData((prev) => ({ ...prev, artist: e.target.value }))}
          aria-label="Artist"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20">
          <input
            className="w-full px-2 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base placeholder-gray-400"
            type="number"
            placeholder="BPM"
            value={songData.bpm}
            onChange={e => setSongData((prev) => ({ ...prev, bpm: e.target.value }))}
            aria-label="Beats Per Minute"
          />
        </div>
        <span className="text-xs text-gray-500">bpm</span>
      </div>
    </div>
  );
};

export default SongInfoBar;
