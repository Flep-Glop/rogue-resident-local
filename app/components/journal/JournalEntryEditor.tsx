import React, { useState } from 'react';

interface JournalEntryEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const JournalEntryEditor: React.FC<JournalEntryEditorProps> = ({ 
  initialContent, 
  onSave,
  onCancel
}) => {
  const [content, setContent] = useState(initialContent);
  
  const handleSave = () => {
    onSave(content);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <textarea
        className="w-full h-60 bg-gray-800 border border-gray-700 rounded p-3 text-white"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your notes here..."
      />
      
      <div className="flex justify-end space-x-3 mt-4">
        <button
          className="py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}; 