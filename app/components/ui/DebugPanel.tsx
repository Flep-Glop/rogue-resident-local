'use client';

import React, { useState, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { centralEventBus } from '@/app/core/events/CentralEventBus';
import { GameEventType, GamePhase, KnowledgeDomain, Season } from '@/app/types';
import { useActivityStore } from '@/app/store/activityStore';
import { useKnowledgeStore } from '@/app/store/knowledgeStore';
import { useJournalStore } from '@/app/store/journalStore';
import { useDialogueStore } from '@/app/store/dialogueStore';
import { dialogues } from '@/app/data/dialogueData';

type MentorId = 'garcia' | 'kapoor' | 'jesse' | 'quinn';

export default function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<MentorId | ''>('');
  const [selectedDialogueId, setSelectedDialogueId] = useState<string>('');
  
  const { 
    currentPhase, 
    currentSeason,
    daysPassed,
    currentTime,
    resources,
    setPhase,
    setSeason,
    advanceTime,
    addMomentum,
    resetMomentum,
    addInsight,
    addStarPoints,
    resetDay
  } = useGameStore();
  
  const { generateAvailableActivities } = useActivityStore();
  
  // Knowledge store state and actions - separate selectors
  const stars = useKnowledgeStore(state => state.stars);
  const discoveredToday = useKnowledgeStore(state => state.discoveredToday);
  const discoverConcept = useKnowledgeStore(state => state.discoverConcept);
  const unlockStar = useKnowledgeStore(state => state.unlockStar);
  const toggleStarActive = useKnowledgeStore(state => state.toggleStarActive);
  const increaseMastery = useKnowledgeStore(state => state.increaseMastery);
  
  // Journal store state and actions
  const addConceptEntry = useJournalStore(state => state.addConceptEntry);
  const addMentorEntry = useJournalStore(state => state.addMentorEntry);
  const conceptEntries = useJournalStore(state => state.conceptEntries);
  const mentorEntries = useJournalStore(state => state.mentorEntries);

  // Dialogue store state and actions
  const startDialogue = useDialogueStore(state => state.startDialogue);
  const mentors = useDialogueStore(state => state.mentors);
  const updateMentorRelationship = useDialogueStore(state => state.updateMentorRelationship);
  
  // Toggle debug panel visibility
  const togglePanel = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Phase controls
  const switchToDay = useCallback(() => setPhase(GamePhase.DAY), [setPhase]);
  const switchToNight = useCallback(() => setPhase(GamePhase.NIGHT), [setPhase]);
  
  // Time controls
  const advanceBy60 = useCallback(() => advanceTime(60), [advanceTime]);
  const advanceBy120 = useCallback(() => advanceTime(120), [advanceTime]);
  const jumpToEndOfDay = useCallback(() => advanceTime((17 - currentTime.hour) * 60 - currentTime.minute), [advanceTime, currentTime]);
  
  // Resource controls
  const addMomentumPoint = useCallback(() => addMomentum(1), [addMomentum]);
  const maxMomentum = useCallback(() => addMomentum(3), [addMomentum]);
  const clearMomentum = useCallback(() => resetMomentum(), [resetMomentum]);
  
  const add10Insight = useCallback(() => addInsight(10), [addInsight]);
  const add25Insight = useCallback(() => addInsight(25), [addInsight]);
  const add50Insight = useCallback(() => addInsight(50), [addInsight]);
  
  const add1SP = useCallback(() => addStarPoints(1), [addStarPoints]);
  const add5SP = useCallback(() => addStarPoints(5), [addStarPoints]);
  const add10SP = useCallback(() => addStarPoints(10), [addStarPoints]);
  
  // Knowledge controls
  const discoverSelectedConcept = useCallback(() => {
    if (selectedConceptId) {
      discoverConcept(selectedConceptId, 'debug_panel');
    }
  }, [selectedConceptId, discoverConcept]);
  
  const unlockSelectedConcept = useCallback(() => {
    if (selectedConceptId) {
      unlockStar(selectedConceptId);
    }
  }, [selectedConceptId, unlockStar]);
  
  const toggleActiveSelectedConcept = useCallback(() => {
    if (selectedConceptId) {
      toggleStarActive(selectedConceptId);
    }
  }, [selectedConceptId, toggleStarActive]);
  
  const increaseMasterySelectedConcept = useCallback((amount: number) => {
    if (selectedConceptId) {
      increaseMastery(selectedConceptId, amount);
    }
  }, [selectedConceptId, increaseMastery]);
  
  // Journal controls
  const addConceptNote = useCallback(() => {
    if (selectedConceptId && stars[selectedConceptId]) {
      const star = stars[selectedConceptId];
      addConceptEntry(
        selectedConceptId,
        `Notes on ${star.name}`,
        `These are my additional notes on ${star.name}. Added via debug panel.`,
        star.domain
      );
    }
  }, [selectedConceptId, stars, addConceptEntry]);
  
  const addMentorNote = useCallback(() => {
    if (selectedMentorId) {
      addMentorEntry(
        selectedMentorId as MentorId,
        `Notes from meeting with ${getMentorName(selectedMentorId as MentorId)}`,
        `This is a record of my meeting with ${getMentorName(selectedMentorId as MentorId)}. Added via debug panel.`
      );
    }
  }, [selectedMentorId, addMentorEntry]);
  
  // Get mentor name from ID
  const getMentorName = (mentorId: MentorId) => {
    const mentorNames: Record<MentorId, string> = {
      garcia: 'Dr. Garcia',
      kapoor: 'Dr. Kapoor',
      jesse: 'Jesse',
      quinn: 'Dr. Quinn'
    };
    
    return mentorNames[mentorId] || mentorId;
  };
  
  // Season controls
  const cycleSeason = useCallback(() => {
    const seasons = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
    const currentIndex = seasons.indexOf(currentSeason);
    const nextIndex = (currentIndex + 1) % seasons.length;
    setSeason(seasons[nextIndex]);
  }, [currentSeason, setSeason]);
  
  // Refresh activities
  const refreshActivities = useCallback(() => {
    generateAvailableActivities();
  }, [generateAvailableActivities]);
  
  // Start selected dialogue
  const startSelectedDialogue = useCallback(() => {
    if (selectedDialogueId) {
      startDialogue(selectedDialogueId);
    }
  }, [selectedDialogueId, startDialogue]);
  
  // Increase mentor relationship
  const increaseMentorRelationship = useCallback((amount: number) => {
    if (selectedMentorId) {
      updateMentorRelationship(selectedMentorId, amount);
    }
  }, [selectedMentorId, updateMentorRelationship]);
  
  // If panel is collapsed, just show the toggle button
  if (!isExpanded) {
    return (
      <button
        onClick={togglePanel}
        className="fixed top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50"
      >
        🛠️ Debug
      </button>
    );
  }
  
  return (
    <div className="fixed top-0 right-0 w-80 h-screen bg-gray-900 text-white overflow-y-auto shadow-lg z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Debug Panel</h2>
        <button
          onClick={togglePanel}
          className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Game State */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Game State</h3>
          <div className="text-sm space-y-1">
            <p>Phase: <span className="text-blue-400">{currentPhase}</span></p>
            <p>Season: <span className="text-green-400">{currentSeason}</span></p>
            <p>Day: <span className="text-yellow-400">{daysPassed + 1}</span></p>
            <p>Time: <span className="text-purple-400">{currentTime.hour}:{currentTime.minute.toString().padStart(2, '0')}</span></p>
          </div>
        </section>
        
        {/* Resources */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Resources</h3>
          <div className="text-sm space-y-1">
            <p>Momentum: <span className="text-yellow-400">{resources.momentum}/3</span></p>
            <p>Insight: <span className="text-blue-400">{resources.insight}</span></p>
            <p>Star Points: <span className="text-purple-400">{resources.starPoints}</span></p>
          </div>
        </section>
        
        {/* Phase Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Phase Controls</h3>
          <div className="flex space-x-2">
            <button 
              onClick={switchToDay}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              disabled={currentPhase === GamePhase.DAY}
            >
              Day Phase
            </button>
            <button 
              onClick={switchToNight}
              className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm"
              disabled={currentPhase === GamePhase.NIGHT}
            >
              Night Phase
            </button>
          </div>
        </section>
        
        {/* Time Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Time Controls</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={advanceBy60}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
            >
              +1 hour
            </button>
            <button 
              onClick={advanceBy120}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
            >
              +2 hours
            </button>
            <button 
              onClick={jumpToEndOfDay}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
            >
              End day
            </button>
            <button 
              onClick={resetDay}
              className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-sm"
            >
              Reset to 8 AM
            </button>
          </div>
        </section>
        
        {/* Resource Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Resource Controls</h3>
          
          <div className="mb-2">
            <p className="text-sm mb-1">Momentum:</p>
            <div className="flex space-x-2">
              <button 
                onClick={addMomentumPoint}
                className="bg-yellow-700 hover:bg-yellow-600 px-2 py-1 rounded text-xs"
              >
                +1
              </button>
              <button 
                onClick={maxMomentum}
                className="bg-yellow-700 hover:bg-yellow-600 px-2 py-1 rounded text-xs"
              >
                Max (3)
              </button>
              <button 
                onClick={clearMomentum}
                className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="mb-2">
            <p className="text-sm mb-1">Insight:</p>
            <div className="flex space-x-2">
              <button 
                onClick={add10Insight}
                className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
              >
                +10
              </button>
              <button 
                onClick={add25Insight}
                className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
              >
                +25
              </button>
              <button 
                onClick={add50Insight}
                className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
              >
                +50
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-sm mb-1">Star Points:</p>
            <div className="flex space-x-2">
              <button 
                onClick={add1SP}
                className="bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded text-xs"
              >
                +1
              </button>
              <button 
                onClick={add5SP}
                className="bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded text-xs"
              >
                +5
              </button>
              <button 
                onClick={add10SP}
                className="bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded text-xs"
              >
                +10
              </button>
            </div>
          </div>
        </section>
        
        {/* Knowledge Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Knowledge Controls</h3>
          
          <div className="mb-3">
            <label htmlFor="concept-select" className="text-sm block mb-1">Select Concept:</label>
            <select
              id="concept-select"
              value={selectedConceptId}
              onChange={(e) => setSelectedConceptId(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded p-1 text-sm"
            >
              <option value="">-- Choose a concept --</option>
              {Object.values(stars).map(star => (
                <option key={star.id} value={star.id}>
                  {star.name} ({star.discovered ? 'Discovered' : 'Hidden'})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={discoverSelectedConcept}
              className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs"
              disabled={!selectedConceptId}
            >
              Discover
            </button>
            <button 
              onClick={unlockSelectedConcept}
              className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
              disabled={!selectedConceptId}
            >
              Unlock
            </button>
            <button 
              onClick={toggleActiveSelectedConcept}
              className="bg-indigo-700 hover:bg-indigo-600 px-2 py-1 rounded text-xs"
              disabled={!selectedConceptId}
            >
              Toggle Active
            </button>
            <button 
              onClick={() => increaseMasterySelectedConcept(10)}
              className="bg-purple-700 hover:bg-purple-600 px-2 py-1 rounded text-xs"
              disabled={!selectedConceptId}
            >
              +10% Mastery
            </button>
          </div>
          
          <div className="mt-2 text-xs">
            <p>Concepts discovered today: {discoveredToday.length}</p>
          </div>
        </section>
        
        {/* Journal Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Journal Controls</h3>
          
          <div className="mb-3">
            <button 
              onClick={addConceptNote}
              className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-sm w-full"
              disabled={!selectedConceptId}
            >
              Add Note for Selected Concept
            </button>
          </div>
          
          <div className="mb-2">
            <label htmlFor="mentor-select" className="text-sm block mb-1">Select Mentor:</label>
            <select
              id="mentor-select"
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value as MentorId)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded p-1 text-sm"
            >
              <option value="">-- Choose a mentor --</option>
              <option value="garcia">Dr. Garcia</option>
              <option value="kapoor">Dr. Kapoor</option>
              <option value="jesse">Jesse</option>
              <option value="quinn">Dr. Quinn</option>
            </select>
          </div>
          
          <button 
            onClick={addMentorNote}
            className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-sm w-full"
            disabled={!selectedMentorId}
          >
            Add Note for Selected Mentor
          </button>
        </section>
        
        {/* Dialogue Controls */}
        <section className="border-b border-gray-700 pb-4">
          <h3 className="text-md font-semibold mb-2">Dialogue Controls</h3>
          
          {/* Select dialogue */}
          <div className="mb-3">
            <label className="block text-sm mb-1">Select Dialogue:</label>
            <select
              value={selectedDialogueId}
              onChange={(e) => setSelectedDialogueId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="">-- Select Dialogue --</option>
              {Object.keys(dialogues).map(id => (
                <option key={id} value={id}>{dialogues[id].title}</option>
              ))}
            </select>
            <button
              onClick={startSelectedDialogue}
              disabled={!selectedDialogueId}
              className="mt-2 bg-blue-800 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 px-3 py-1 rounded text-sm w-full"
            >
              Start Dialogue
            </button>
          </div>
          
          {/* Mentor relationships */}
          <div className="mb-3">
            <label className="block text-sm mb-1">Select Mentor:</label>
            <select
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value as MentorId | '')}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="">-- Select Mentor --</option>
              {Object.keys(mentors).map(id => (
                <option key={id} value={id}>{mentors[id].name}</option>
              ))}
            </select>
            <div className="flex space-x-1 mt-2">
              <button
                onClick={() => increaseMentorRelationship(5)}
                disabled={!selectedMentorId}
                className="bg-green-800 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-600 px-2 py-1 rounded text-xs flex-1"
              >
                +5 Relationship
              </button>
              <button
                onClick={() => increaseMentorRelationship(10)}
                disabled={!selectedMentorId}
                className="bg-green-800 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-600 px-2 py-1 rounded text-xs flex-1"
              >
                +10 Relationship
              </button>
            </div>
          </div>
        </section>
        
        {/* Miscellaneous Controls */}
        <section>
          <h3 className="text-md font-semibold mb-2">Misc. Controls</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={cycleSeason}
              className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-sm"
            >
              Change Season
            </button>
            <button 
              onClick={refreshActivities}
              className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-sm"
            >
              Refresh Activities
            </button>
          </div>
        </section>
      </div>
    </div>
  );
} 