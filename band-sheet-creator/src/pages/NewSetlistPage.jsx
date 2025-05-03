import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page component for creating a new setlist.
 */
const NewSetlistPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, showAuthModal } = useAuth();
  const [setlistName, setSetlistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSetlist = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }

    if (!setlistName.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call the setlist creation API
      // For now, we'll just redirect back to the setlists page
      setTimeout(() => {
        navigate('/setlists');
      }, 500);
    } catch (error) {
      console.error('Error creating setlist:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Setlist</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <form onSubmit={handleCreateSetlist}>
          <div className="mb-6">
            <label htmlFor="setlistName" className="block text-sm font-medium mb-2">
              Setlist Name
            </label>
            <input
              id="setlistName"
              type="text"
              className="w-full p-2 border border-border rounded-md"
              placeholder="Enter setlist name..."
              value={setlistName}
              onChange={(e) => setSetlistName(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/setlists')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !setlistName.trim()}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Setlist
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSetlistPage;
