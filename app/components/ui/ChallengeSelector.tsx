'use client';

import React, { useState, useEffect } from 'react';
import { MentorId, KnowledgeDomain } from '../../types';
import { 
  createChallenge, 
  createThematicChallenge, 
  createBossEncounter, 
  createMorningRoundsChallenge,
  createMentorSpecificChallenge,
  ChallengeType,
  ChallengeDifficulty,
  ActiveChallenge
} from '../../core/activities/challengeManager';

// Subtopics by domain for more cohesive challenges
const DOMAIN_SUBTOPICS: Record<KnowledgeDomain, string[]> = {
  [KnowledgeDomain.TREATMENT_PLANNING]: [
    'Dose Calculation', 
    'Plan Optimization', 
    'Critical Structures', 
    'Target Volume Delineation'
  ],
  [KnowledgeDomain.RADIATION_THERAPY]: [
    'Treatment Techniques', 
    'Patient Positioning', 
    'Immobilization', 
    'Treatment Verification'
  ],
  [KnowledgeDomain.LINAC_ANATOMY]: [
    'Beam Generation', 
    'Beam Collimation', 
    'MLC Operation', 
    'Imaging Systems'
  ],
  [KnowledgeDomain.DOSIMETRY]: [
    'Quality Assurance', 
    'Dose Measurement', 
    'Calibration', 
    'Radiation Safety'
  ]
};

const ChallengeSelector: React.FC = () => {
  const [selectedMentor, setSelectedMentor] = useState<MentorId>(MentorId.KAPOOR);
  const [selectedDomain, setSelectedDomain] = useState<KnowledgeDomain>(KnowledgeDomain.DOSIMETRY);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [challengeType, setChallengeType] = useState<ChallengeType>(ChallengeType.STANDARD);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>(ChallengeDifficulty.BALANCED);
  const [createdChallenge, setCreatedChallenge] = useState<ActiveChallenge | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update domain when mentor changes
  useEffect(() => {
    // Set the domain that matches the selected mentor
    const domainForMentor = getMentorDomain(selectedMentor);
    setSelectedDomain(domainForMentor);
    
    // Reset subtopic when domain changes
    setSelectedSubtopic('');
  }, [selectedMentor]);
  
  // Update subtopic options when domain changes
  useEffect(() => {
    if (DOMAIN_SUBTOPICS[selectedDomain]?.length > 0) {
      setSelectedSubtopic(DOMAIN_SUBTOPICS[selectedDomain][0]);
    } else {
      setSelectedSubtopic('');
    }
  }, [selectedDomain]);

  // Get domain for a mentor
  const getMentorDomain = (mentorId: MentorId): KnowledgeDomain => {
    switch (mentorId) {
      case MentorId.KAPOOR: return KnowledgeDomain.DOSIMETRY;
      case MentorId.JESSE: return KnowledgeDomain.LINAC_ANATOMY;
      case MentorId.GARCIA: return KnowledgeDomain.RADIATION_THERAPY;
      case MentorId.QUINN: return KnowledgeDomain.TREATMENT_PLANNING;
      default: return KnowledgeDomain.DOSIMETRY;
    }
  };

  // Get mentor name
  const getMentorName = (mentorId: MentorId): string => {
    switch (mentorId) {
      case MentorId.KAPOOR: return "Dr. Kapoor";
      case MentorId.JESSE: return "Dr. Jesse";
      case MentorId.GARCIA: return "Dr. Garcia";
      case MentorId.QUINN: return "Dr. Quinn";
      default: return "Mentor";
    }
  };

  // Handle creating a new challenge
  const handleCreateChallenge = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let challenge: ActiveChallenge;
      
      switch (challengeType) {
        case ChallengeType.BOSS:
          challenge = await createBossEncounter(
            selectedDomain, 
            selectedMentor,
            selectedSubtopic
          );
          break;
          
        case ChallengeType.STANDARD:
          if (selectedSubtopic) {
            // Create a thematic challenge based on subtopic
            challenge = await createThematicChallenge(
              selectedDomain,
              selectedSubtopic,
              selectedMentor
            );
          } else {
            // Create a generic challenge
            challenge = await createChallenge({
              type: challengeType,
              difficulty,
              domain: selectedDomain,
              mentor: selectedMentor
            });
          }
          break;
          
        default:
          // Create a challenge with the specified parameters
          challenge = await createChallenge({
            type: challengeType,
            difficulty,
            domain: selectedDomain,
            mentor: selectedMentor,
            subtopic: selectedSubtopic
          });
      }
      
      setCreatedChallenge(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      setError("Failed to create challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a morning rounds challenge with the selected mentor
  const handleMorningRounds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const challenge = await createMorningRoundsChallenge(selectedMentor);
      setCreatedChallenge(challenge);
    } catch (error) {
      console.error("Error creating morning rounds challenge:", error);
      setError("Failed to create morning rounds challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add a new function to handle creating a mentor-specific challenge
  const handleMentorSpecificChallenge = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const challenge = await createMentorSpecificChallenge(
        selectedMentor,
        `${getMentorName(selectedMentor)}'s Focused Session`
      );
      setCreatedChallenge(challenge);
    } catch (error) {
      console.error("Error creating mentor-specific challenge:", error);
      setError("Failed to create mentor-specific challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg max-w-3xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6">Challenge Creator</h2>
      
      <div className="mb-4 p-3 bg-blue-800 rounded-md text-sm">
        <strong>Note:</strong> Challenges will only include questions from the selected mentor, regardless of domain.
        This ensures consistent dialogue and teaching style throughout the challenge.
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Mentor Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Select Mentor</label>
          <select 
            className="w-full p-2 bg-gray-700 rounded-md text-white"
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value as MentorId)}
          >
            <option value={MentorId.KAPOOR}>Dr. Kapoor (Dosimetry)</option>
            <option value={MentorId.JESSE}>Dr. Jesse (Linac Anatomy)</option>
            <option value={MentorId.GARCIA}>Dr. Garcia (Radiation Therapy)</option>
            <option value={MentorId.QUINN}>Dr. Quinn (Treatment Planning)</option>
          </select>
        </div>
        
        {/* Domain Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Domain</label>
          <select 
            className="w-full p-2 bg-gray-700 rounded-md text-white"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value as KnowledgeDomain)}
          >
            <option value={KnowledgeDomain.DOSIMETRY}>Dosimetry</option>
            <option value={KnowledgeDomain.LINAC_ANATOMY}>Linac Anatomy</option>
            <option value={KnowledgeDomain.RADIATION_THERAPY}>Radiation Therapy</option>
            <option value={KnowledgeDomain.TREATMENT_PLANNING}>Treatment Planning</option>
          </select>
        </div>
        
        {/* Subtopic Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Subtopic</label>
          <select 
            className="w-full p-2 bg-gray-700 rounded-md text-white"
            value={selectedSubtopic}
            onChange={(e) => setSelectedSubtopic(e.target.value)}
          >
            <option value="">Any Subtopic</option>
            {DOMAIN_SUBTOPICS[selectedDomain]?.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
        
        {/* Challenge Type */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Challenge Type</label>
          <select 
            className="w-full p-2 bg-gray-700 rounded-md text-white"
            value={challengeType}
            onChange={(e) => setChallengeType(e.target.value as ChallengeType)}
          >
            <option value={ChallengeType.STANDARD}>Standard Challenge</option>
            <option value={ChallengeType.BOSS}>Boss Encounter</option>
            <option value={ChallengeType.BOAST}>Boast Challenge</option>
            <option value={ChallengeType.DISCOVERY}>Discovery Challenge</option>
          </select>
        </div>
        
        {/* Difficulty */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Difficulty</label>
          <select 
            className="w-full p-2 bg-gray-700 rounded-md text-white"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as ChallengeDifficulty)}
          >
            <option value={ChallengeDifficulty.EASY}>Easy</option>
            <option value={ChallengeDifficulty.BALANCED}>Balanced</option>
            <option value={ChallengeDifficulty.HARD}>Hard</option>
          </select>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          onClick={handleCreateChallenge}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Challenge'}
        </button>
        
        <button
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md"
          onClick={handleMorningRounds}
          disabled={loading}
        >
          Morning Rounds with {getMentorName(selectedMentor)}
        </button>
        
        <button
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md"
          onClick={handleMentorSpecificChallenge}
          disabled={loading}
        >
          {getMentorName(selectedMentor)} Focus Session
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {/* Created Challenge Display */}
      {createdChallenge && (
        <div className="mt-8 p-4 border border-gray-600 rounded-lg">
          <h3 className="text-xl font-bold mb-4">{createdChallenge.title}</h3>
          <p className="mb-4">Type: {createdChallenge.config.type}</p>
          <p className="mb-4">Difficulty: {createdChallenge.config.difficulty}</p>
          <p className="mb-4">Questions: {createdChallenge.questions.length}</p>
          
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Questions:</h4>
            <ul className="space-y-4">
              {createdChallenge.questions.map((question, index) => (
                <li key={question.id} className="border-l-4 border-blue-500 pl-4">
                  <span className="font-medium">{index + 1}. {question.type}</span>
                  <div className="text-sm text-gray-300 mt-1">
                    <p>Mentor: {getMentorName(question.tags.mentor)}</p>
                    <p>Domain: {question.tags.domain}</p>
                    <p>Subtopic: {question.tags.subtopic}</p>
                    <p>Difficulty: {question.tags.difficulty}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeSelector; 