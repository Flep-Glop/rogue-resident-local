import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { GamePhase, Difficulty } from '@/app/types';
import Image from 'next/image';

interface DialogueLine {
  text: string;
  speaker: 'garcia' | 'player';
  delay?: number;
  choices?: DialogueChoice[];
  id?: string;
  isNameInput?: boolean;
}

interface DialogueChoice {
  text: string;
  nextId?: string;
  effect?: () => void;
}

export const Prologue: React.FC = () => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const setPhase = useGameStore(state => state.setPhase);
  const setDifficulty = useGameStore(state => state.setDifficulty);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const [fadeKey, setFadeKey] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [dialogueMap, setDialogueMap] = useState<Record<string, number>>({});
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [playerNameInput, setPlayerNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Dialogue script for the prologue with branching support
  const dialogue: DialogueLine[] = [
    { 
      speaker: 'garcia', 
      text: "Welcome to Memorial General Hospital! I'm Dr. Garcia, Radiation Oncologist and Education Coordinator. The building might be all straight lines, but in medical physics, rarely is anything so simple." 
    },
    {
      speaker: 'garcia',
      text: "I don't believe I caught your name on the paperwork. Could you introduce yourself?",
      isNameInput: true,
      id: "name_input"
    },
    {
      speaker: 'garcia',
      text: "Nice to meet you, [PLAYER_NAME]. We're glad to have you join our team at Memorial General.",
    },
    { 
      speaker: 'garcia', 
      text: "Your academic record is impressive—quite the constellation of achievements. Before we start, I'd like to know a bit more about your background. This will help me tailor your residency experience appropriately." ,
      choices: [
        { 
          text: "I'm fresh out of undergrad with a physics degree. (Beginner Mode: More explanations, gentler learning curve)",
          effect: () => setDifficulty(Difficulty.BEGINNER),
          nextId: "beginner_garcia_response"
        },
        { 
          text: "I just finished my doctorate in medical physics. (Standard Mode: Balanced challenge)",
          effect: () => setDifficulty(Difficulty.STANDARD),
          nextId: "standard_garcia_response"
        },
        { 
          text: "I practiced medical physics in another country. (Expert Mode: Advanced concepts, steeper mastery requirements)",
          effect: () => setDifficulty(Difficulty.EXPERT),
          nextId: "expert_garcia_response"
        }
      ],
      id: "background_question"
    },
    { 
      speaker: 'garcia', 
      text: "Excellent! We'll make sure to provide you with plenty of foundational knowledge. You'll have more opportunities for self-study, and we'll take a bit more time with the technical concepts. It's a perfect starting point.",
      id: "beginner_garcia_response"
    },
    { 
      speaker: 'garcia', 
      text: "Perfect timing then! You have the theoretical foundation, and now you'll get to see how it applies in practice. We'll balance explanation with application throughout your time here.",
      id: "standard_garcia_response"
    },
    { 
      speaker: 'garcia', 
      text: "Fantastic! Your experience will be valuable. We'll be able to move at a quicker pace and focus on advanced topics sooner. I look forward to your international perspective on our methods.",
      id: "expert_garcia_response"
    },
    { 
      speaker: 'garcia', 
      text: "You'll rotate through all areas of our department—treatment planning, radiation therapy, equipment QA, and dosimetry. I see these not as separate fields but as interconnected stars in the night sky of medical physics." 
    },
    { 
      speaker: 'garcia', 
      text: "Time management is crucial here. Unlike subatomic particles, we can't be in two places at once—though Dr. Quinn has a theory about that too. Choose your daily activities wisely."
    },
    { 
      speaker: 'garcia', 
      text: "You'll work with several mentors: myself, Dr. Kapoor—who believes protocols are sacred texts, Jesse—who can diagnose a linac malfunction from the sound it makes, and Dr. Quinn—whose ideas occasionally bend the laws of physics."
    },
    { 
      speaker: 'garcia', 
      text: "I'm sure you must have questions about the residency program. What would you like to know?",
      choices: [
        {
          text: "How will my day-to-day activities be structured?",
          nextId: "schedule_question"
        },
        {
          text: "Which mentor would you recommend I focus on initially?",
          nextId: "mentor_question"
        },
        {
          text: "What are the key areas where residents typically struggle?",
          nextId: "struggle_question"
        }
      ],
      id: "first_question"
    },
    { 
      speaker: 'garcia', 
      text: "Each day runs from 8 to 5, with various opportunities throughout. I believe in balance—rigorous science balanced with compassionate care. The schedule may seem rigid, but there's an art to working within it.",
      id: "schedule_question"
    },
    { 
      speaker: 'garcia', 
      text: "It depends on your learning style. Dr. Kapoor is methodical and precise—perfect if you prefer structure. Jesse offers practical, hands-on learning. Dr. Quinn will challenge your conceptual thinking. And I focus on integrating physics with patient care.",
      id: "mentor_question"
    },
    { 
      speaker: 'garcia', 
      text: "Time management is the biggest challenge. Second is connecting theoretical knowledge to practical application. And third is maintaining balance—between technical excellence and patient compassion, between different knowledge domains.",
      id: "struggle_question"
    },
    { 
      speaker: 'garcia', 
      text: "Evenings are for your 'Knowledge Constellation'—my favorite metaphor for expertise. It's not just collecting stars of knowledge, but understanding how they illuminate each other. Some residents find it poetic; others call it my astronomy obsession."
    },
    { 
      speaker: 'garcia', 
      text: "As you progress, you'll gain more control and develop abilities that enhance your learning. I've seen residents transform from uncertain observers to confident specialists—it's why I love teaching despite the administrative paperwork."
    },
    { 
      speaker: 'garcia', 
      text: "Let's tour the facility. I believe in understanding both the machines and the people who use them. The equipment might be precise, but it's the human element that truly makes medical physics fascinating."
    },
    { 
      speaker: 'garcia', 
      text: "Before we begin, I'd like to know what aspect of medical physics interests you most. This will help me guide your experience.",
      choices: [
        {
          text: "I appreciate both the scientific precision and the human perspective you're emphasizing.",
          nextId: "balanced_garcia_response"
        },
        {
          text: "I'm excited to learn about the equipment and technical aspects of medical physics.",
          nextId: "technical_garcia_response"
        },
        {
          text: "I'm most interested in how our work impacts patient care and outcomes.",
          nextId: "patient_garcia_response"
        }
      ],
      id: "approach_choice"
    },
    { 
      speaker: 'garcia', 
      text: "A balanced approach will serve you well. To the treatment planning room—where art and science converge, and where I've been known to quote both Newton and Neruda in the same sentence. You'll see what I mean.",
      id: "balanced_garcia_response"
    },
    { 
      speaker: 'garcia', 
      text: "The technical side is fascinating! I'll make sure Jesse and Dr. Kapoor show you our equipment in depth. The linacs have their own personalities once you get to know them.",
      id: "technical_garcia_response"
    },
    { 
      speaker: 'garcia', 
      text: "Patient outcomes are indeed what matters most. I'll arrange for you to observe patient consultations early on. We never forget that behind every treatment plan is a person with hopes and fears.",
      id: "patient_garcia_response"
    },
  ];

  // Initialize dialogue map on first render
  useEffect(() => {
    const map: Record<string, number> = {};
    dialogue.forEach((line, index) => {
      if (line.id) {
        map[line.id] = index;
      }
    });
    setDialogueMap(map);
  }, []);

  // Focus the name input field when it appears
  useEffect(() => {
    if (currentLine.isNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentLineIndex]);

  const currentLine = dialogue[currentLineIndex] || dialogue[0];

  // Replace [PLAYER_NAME] with the actual player name in dialogue
  const getDisplayText = (text: string) => {
    return text.replace('[PLAYER_NAME]', playerNameInput || 'Resident');
  };

  // Handle advancing the dialogue
  const advanceDialogue = () => {
    // Handle name input special case
    if (currentLine.isNameInput) {
      if (playerNameInput.trim()) {
        // Save the player name to the game store
        setPlayerName(playerNameInput.trim());
        setCurrentLineIndex(currentLineIndex + 1);
        setFadeKey(prevKey => prevKey + 1);
      }
      return;
    }

    if (currentLine.choices && !showChoices) {
      setShowChoices(true);
      return;
    }

    if (currentLineIndex < dialogue.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
      setFadeKey(prevKey => prevKey + 1);
      setShowChoices(false);
    } else {
      // Transition to day phase when dialogue is complete
      setPhase(GamePhase.DAY);
    }
  };

  // Handle player choice selection
  const handleChoiceSelect = (choice: DialogueChoice) => {
    if (currentLine.id) {
      setSelectedChoices(prev => ({
        ...prev,
        [currentLine.id]: choice.text
      }));
    }

    if (choice.effect) {
      choice.effect();
    }

    if (choice.nextId && dialogueMap[choice.nextId] !== undefined) {
      setCurrentLineIndex(dialogueMap[choice.nextId]);
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
    
    setFadeKey(prevKey => prevKey + 1);
    setShowChoices(false);
  };

  // Handle name input form submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerNameInput.trim()) {
      advanceDialogue();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-end bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hospital background */}
      <div className="absolute inset-0 flex justify-center items-center opacity-20">
        <div className="w-full h-full bg-cover bg-center">
          <img src="/images/hospital-bg.svg" alt="Hospital" className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Character portrait - replace with actual character art when available */}
      <div className="absolute bottom-0 left-8 w-96 h-96">
        <Image 
          src="/images/garcia.png" 
          alt="Dr. Garcia" 
          width={384} 
          height={384}
          className="w-96 h-96"
          style={{ imageRendering: 'pixelated' }}
          priority
        />
      </div>
      
      {/* Dialogue box - now with fixed width and centered */}
      <div 
        className="relative mx-auto mb-8 p-6 bg-slate-800 bg-opacity-90 rounded-xl border border-slate-700 shadow-lg cursor-pointer w-5/6 max-w-4xl"
        onClick={(!currentLine.isNameInput && !showChoices) ? advanceDialogue : undefined}
      >
        <div className="text-xl font-medium mb-2">
          Dr. Garcia
        </div>
        
        <div 
          key={fadeKey} 
          className="text-lg animate-fade-in"
        >
          {getDisplayText(currentLine.text)}
        </div>
        
        {/* Name input form */}
        {currentLine.isNameInput && (
          <form onSubmit={handleNameSubmit} className="mt-4 flex flex-col space-y-3">
            <input
              ref={nameInputRef}
              type="text"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={30}
            />
            <button 
              type="submit"
              className="self-end px-4 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              disabled={!playerNameInput.trim()}
            >
              Introduce Yourself
            </button>
          </form>
        )}
        
        {/* Choice buttons */}
        {showChoices && currentLine.choices && (
          <div className="mt-4 space-y-2">
            {currentLine.choices.map((choice, index) => (
              <div 
                key={index}
                className="p-3 bg-indigo-700 hover:bg-indigo-600 rounded-md transition-colors cursor-pointer"
                onClick={() => handleChoiceSelect(choice)}
              >
                {choice.text}
              </div>
            ))}
          </div>
        )}
        
        {/* Continue button */}
        {!showChoices && !currentLine.isNameInput && (
          <div className="absolute bottom-2 right-4 px-4 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
            {currentLineIndex < dialogue.length - 1 ? 'Continue' : 'Begin Day 1'}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-2 right-4 text-sm text-slate-400">
        {currentLine.isNameInput ? 'Enter your name' : (showChoices ? 'Select a response' : 'Click to continue')}
      </div>
    </div>
  );
}; 