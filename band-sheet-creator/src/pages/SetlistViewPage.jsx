import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SharedSetlistView from '../components/SharedSetlistView';
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import logger from '../services/LoggingService';
import { getSetlistById } from '../services/SetlistStorageService';

/**
 * Page component for viewing a shared setlist.
 * This is a wrapper around the existing SharedSetlistView component
 * to integrate it with our new design system.
 */
const SetlistViewPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [setlist, setSetlist] = useState(null);
  const [error, setError] = useState(null);
  
  // Directly load the setlist data here to debug issues
  useEffect(() => {
    async function loadSetlist() {
      if (!id) {
        setError("No setlist ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Log ID for debugging
        console.log('SetlistViewPage - Loading setlist with ID:', id);
        logger.debug('SetlistViewPage', 'Loading setlist with ID:', id);
        
        // Try to load the setlist
        const data = await getSetlistById(id);
        console.log('SetlistViewPage - API Response:', data);
        
        if (data) {
          setSetlist(data);
        } else {
          setError(`Setlist not found with ID: ${id}`);
        }
      } catch (err) {
        console.error('Error loading setlist:', err);
        setError(`Error loading setlist: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    
    loadSetlist();
  }, [id]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading setlist...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <div className="bg-destructive/10 border border-destructive rounded-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <Link to="/">
            <Button variant="default">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Render the setlist view if we have data
  if (setlist) {
    return (
      <div className="max-w-6xl mx-auto">
        <SharedSetlistView id={id} setlistData={setlist} />
      </div>
    );
  }
  
  return null;
};

export default SetlistViewPage;
