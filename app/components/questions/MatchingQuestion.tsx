'use client';

import React, { useState, useEffect } from 'react';
import { MatchingQuestion as MatchingQuestionType } from '../../types/questions';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';

interface MatchingQuestionProps {
  question: MatchingQuestionType;
  onAnswer: (answer: any) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

// Item type for drag and drop
const ItemTypes = {
  MATCH_ITEM: 'matchItem',
};

// Drag-and-drop item component
const DraggableItem = ({ item, index, isMatched }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MATCH_ITEM,
    item: { index, id: item.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`cursor-pointer p-3 mb-2 rounded-md text-sm transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${
        isMatched ? 'bg-green-100 border-green-400' : 'bg-blue-50 border-gray-300'
      } border`}
    >
      {item.text}
    </div>
  );
};

// Drop target component
const DropTarget = ({ onDrop, matchedItem, matchItem }: any) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.MATCH_ITEM,
    drop: (item: any) => onDrop(item.index, matchItem.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`h-24 p-3 mb-2 border-2 border-dashed rounded-md flex items-center justify-center transition-all ${
        isOver && canDrop ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'
      } ${matchedItem ? 'border-solid border-green-400' : ''}`}
    >
      {matchedItem ? (
        <div className="w-full bg-green-100 p-2 rounded-md">{matchedItem.text}</div>
      ) : (
        <div className="text-gray-400 text-center">Drop item here</div>
      )}
    </div>
  );
};

// Mobile-friendly selection component for non-drag-and-drop environments
const SelectionMatching = ({ items, matches, onMatch }: any) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleMatchClick = (matchId: string) => {
    if (selectedItem) {
      const newPairs = { ...matchedPairs, [selectedItem]: matchId };
      setMatchedPairs(newPairs);
      onMatch(newPairs);
      setSelectedItem(null);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="font-semibold mb-2">Select an item, then select its match:</div>
      
      {/* Items */}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item: any) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`p-3 rounded-md cursor-pointer transition-all ${
              selectedItem === item.id
                ? 'bg-blue-200 border-blue-500'
                : matchedPairs[item.id]
                ? 'bg-green-100 border-green-400'
                : 'bg-blue-50 border-gray-300'
            } border`}
          >
            {item.text}
          </div>
        ))}
      </div>
      
      {/* Matches */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        <div className="font-semibold mb-2">Matching options:</div>
        {matches.map((match: any) => {
          const isMatched = Object.values(matchedPairs).includes(match.id);
          const matchingItemId = Object.keys(matchedPairs).find(
            (key) => matchedPairs[key] === match.id
          );
          const matchingItem = matchingItemId 
            ? items.find((i: any) => i.id === matchingItemId) 
            : null;
            
          return (
            <div
              key={match.id}
              onClick={() => handleMatchClick(match.id)}
              className={`p-3 rounded-md cursor-pointer transition-all ${
                isMatched
                  ? 'bg-green-100 border-green-400'
                  : selectedItem
                  ? 'bg-blue-50 border-blue-400 border-dashed'
                  : 'bg-gray-50 border-gray-300'
              } border`}
            >
              {match.text}
              {matchingItem && (
                <div className="mt-1 text-xs text-green-800">
                  Matched with: {matchingItem.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  onAnswer,
  showFeedback = false,
  isCorrect,
}) => {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [items, setItems] = useState<any[]>([]);
  const [matchOptions, setMatchOptions] = useState<any[]>([]);

  useEffect(() => {
    if (question.itemsData && question.matchesMap) {
      // Process the items and matches for display
      const processedItems = question.itemsData.map((item: any) => ({
        id: item.id,
        text: item.text || item.label, // Accommodate different formats
      }));

      // Flatten all the match options from each item
      const allMatches: any[] = [];
      Object.entries(question.matchesMap).forEach(([itemId, itemMatches]) => {
        itemMatches.forEach((match: any) => {
          if (!allMatches.some(m => m.id === match.id)) {
            allMatches.push({
              id: match.id,
              text: match.text,
            });
          }
        });
      });

      setItems(processedItems);
      setMatchOptions(allMatches);
    }
  }, [question]);

  // Handler for drag-and-drop matching
  const handleDrop = (itemIndex: number, matchId: string) => {
    const item = items[itemIndex];
    const newMatches = { ...matches, [item.id]: matchId };
    setMatches(newMatches);
    onAnswer(newMatches);
  };

  // Handler for selection-based matching
  const handleMatch = (matchPairs: Record<string, string>) => {
    setMatches(matchPairs);
    onAnswer(matchPairs);
  };

  // Get the matched item for a match
  const getMatchedItem = (matchId: string) => {
    const itemId = Object.keys(matches).find(key => matches[key] === matchId);
    if (!itemId) return null;
    return items.find(item => item.id === itemId);
  };

  // Determine what backend to use based on device
  const dndBackend = isMobile ? TouchBackend : HTML5Backend;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Match the items below:</h3>
      
      {showFeedback && (
        <div
          className={`mb-4 p-3 rounded-md ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isCorrect ? question.feedback.correct : question.feedback.incorrect}
        </div>
      )}

      {isMobile ? (
        <SelectionMatching items={items} matches={matchOptions} onMatch={handleMatch} />
      ) : (
        <DndProvider backend={dndBackend}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Items</h4>
              {items.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  isMatched={!!matches[item.id]}
                />
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2">Matches</h4>
              {matchOptions.map(match => (
                <DropTarget
                  key={match.id}
                  matchItem={match}
                  onDrop={handleDrop}
                  matchedItem={getMatchedItem(match.id)}
                />
              ))}
            </div>
          </div>
        </DndProvider>
      )}
    </div>
  );
};

export default MatchingQuestion; 