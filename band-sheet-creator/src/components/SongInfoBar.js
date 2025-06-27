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
    <div className="flex flex-col gap-4 p-4 bg-gray-50 border border-gray-200 rounded-t-xl shadow-sm mb-2">
      {/* Title - Full width on all devices */}
      <div className="w-full">
        <input
          className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-semibold placeholder-gray-400"
          placeholder="Song Title"
          value={songData.title}
          onChange={e => setSongData((prev) => ({ ...prev, title: e.target.value }))}
          aria-label="Song Title"
        />
      </div>
      
      {/* Artist and BPM on same line */}
      <div className="flex flex-wrap gap-4 items-center">
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
        
        {/* Status toggle */}
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              songData.status === 'Ready' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}
            onClick={() => setSongData((prev) => ({ 
              ...prev, 
              status: prev.status === 'Ready' ? 'WIP' : 'Ready' 
            }))}
            aria-label={`Status: ${songData.status}. Click to toggle.`}
          >
            {songData.status === 'Ready' ? '✓ Ready' : '⚠ WIP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongInfoBar;
