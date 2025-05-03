import React from 'react';
import { useParams } from 'react-router-dom';
import SharedSetlistView from '../components/SharedSetlistView';

/**
 * Page component for viewing a shared setlist.
 * This is a wrapper around the existing SharedSetlistView component
 * to integrate it with our new design system.
 */
const SetlistViewPage = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-6xl mx-auto">
      <SharedSetlistView />
    </div>
  );
};

export default SetlistViewPage;
