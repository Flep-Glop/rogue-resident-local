import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useGameStore } from '@/app/store/gameStore';
import { GamePhase, Difficulty } from '@/app/types';
import Image from 'next/image';
import pixelTheme, { colors, typography, animation, components, mixins, borders, shadows, spacing } from '@/app/styles/pixelTheme';

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

// Styled component definitions
const PrologueContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(to bottom, #121620, #090b12);
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  ${mixins.pixelPerfect}
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(76, 0, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(25, 0, 112, 0.15) 0%, transparent 40%);
    z-index: 0;
    pointer-events: none;
  }
`;

const BackgroundOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.2;
  z-index: 1;
`;

const CharacterPortrait = styled.div`
  position: absolute;
  bottom: 210px;
  left: 150px;
  width: 384px;
  height: 384px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 2;
`;

const DialogueBox = styled.div<{ $isNameInput?: boolean, $showChoices: boolean }>`
  ${components.dialog.container}
  position: relative;
  margin: 0 auto ${spacing.lg};
  width: 83%;
  max-width: 4xl;
  cursor: ${props => (!props.$isNameInput && !props.$showChoices) ? 'pointer' : 'default'};
  z-index: 10;
`;

const DialogueHeader = styled.div`
  ${components.dialog.header}
  font-size: ${typography.fontSize.xl};
  font-weight: medium;
  margin-bottom: ${spacing.xs};
`;

const DialogueContent = styled.div`
  ${components.dialog.content}
  animation: fadeIn ${animation.duration.normal} ${animation.easing.pixel};
`;

const NameInputForm = styled.form`
  margin-top: ${spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const NameInput = styled.input`
  padding: ${spacing.xs} ${spacing.md};
  background-color: ${colors.backgroundAlt};
  border: ${borders.medium};
  border-radius: ${spacing.xs};
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  font-size: ${typography.fontSize.md};
  outline: none;
  
  &:focus {
    box-shadow: ${shadows.glow(colors.highlight)};
  }
`;

const SubmitButton = styled.button<{ $hasText: boolean }>`
  ${components.button.base}
  ${components.button.primary}
  align-self: flex-end;
  padding: ${spacing.xs} ${spacing.md};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.md};
  opacity: ${props => !props.$hasText ? 0.5 : 1};
`;

const ChoiceContainer = styled.div`
  ${components.dialog.options}
  margin-top: ${spacing.md};
`;

const ChoiceButton = styled.div`
  padding: ${spacing.md};
  background-color: ${colors.backgroundAlt};
  ${borders.pixelBorder.outer}
  border-radius: ${spacing.xs};
  cursor: pointer;
  transition: all ${animation.duration.fast} ${animation.easing.pixel};
  
  &:hover {
    ${borders.pixelBorder.active(colors.highlight)}
    background-color: ${colors.highlight};
  }
`;

const ContinueButton = styled.div`
  ${components.button.base}
  position: absolute;
  bottom: ${spacing.xs};
  right: ${spacing.md};
  padding: ${spacing.xs} ${spacing.md};
  background-color: ${colors.highlight};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
`;

const InstructionText = styled.div`
  position: absolute;
  bottom: ${spacing.xs};
  right: ${spacing.md};
  font-size: ${typography.fontSize.sm};
  color: ${colors.textDim};
  text-shadow: ${typography.textShadow.pixel};
`;

export const Prologue: React.FC = () => {
  // Use individual selectors instead of object destructuring to avoid recreating objects on every render
  const setPhase = useGameStore(state => state.setPhase);
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const setDifficulty = useGameStore(state => state.setDifficulty);
  
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [showChoices, setShowChoices] = useState(false);
  const [dialogueMap, setDialogueMap] = useState<Record<string, number>>({});
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [fadeKey, setFadeKey] = useState(0);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Wrap dialogue in useMemo to prevent recreating on every render
  const dialogue = useMemo(() => [
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
  ], [setDifficulty]);

  // Initialize dialogue map on first render
  useEffect(() => {
    const map: Record<string, number> = {};
    dialogue.forEach((line, index) => {
      if (line.id) {
        map[line.id] = index;
      }
    });
    setDialogueMap(map);
  }, [dialogue]);

  const currentLine = dialogue[currentLineIndex] || dialogue[0];

  // Focus the name input field when it appears
  useEffect(() => {
    if (currentLine.isNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentLineIndex, currentLine.isNameInput]);

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
      const newSelectedChoices = {...selectedChoices};
      if (currentLine.id) {
        newSelectedChoices[currentLine.id] = choice.text;
      }
      setSelectedChoices(prev => newSelectedChoices);
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

  // Define animation for text fadeIn
  const fadeInAnimation = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  return (
    <PrologueContainer>
      {/* Hospital background - positioned above the gradient background but below character */}
      <BackgroundOverlay>
        <div className="w-full h-full bg-cover bg-center">
          <Image 
            src="/images/hospital.png" 
            alt="Hospital" 
            fill
            className="object-cover"
            priority
          />
        </div>
      </BackgroundOverlay>
      
      {/* Character portrait */}
      <CharacterPortrait>
        <Image 
          src="/images/garcia.png" 
          alt="Dr. Garcia" 
          width={384} 
          height={384}
          style={{ imageRendering: 'pixelated' }}
          priority
        />
      </CharacterPortrait>
      
      {/* Dialogue box */}
      <DialogueBox 
        $isNameInput={currentLine.isNameInput}
        $showChoices={showChoices}
        onClick={(!currentLine.isNameInput && !showChoices) ? advanceDialogue : undefined}
      >
        <DialogueHeader>
          Dr. Garcia
        </DialogueHeader>
        
        <DialogueContent key={fadeKey}>
          {getDisplayText(currentLine.text)}
        </DialogueContent>
        
        {/* Name input form */}
        {currentLine.isNameInput && (
          <NameInputForm onSubmit={handleNameSubmit}>
            <NameInput
              ref={nameInputRef}
              type="text"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
            />
            <SubmitButton 
              type="submit"
              $hasText={Boolean(playerNameInput.trim())}
              disabled={!playerNameInput.trim()}
            >
              Introduce Yourself
            </SubmitButton>
          </NameInputForm>
        )}
        
        {/* Choice buttons */}
        {showChoices && currentLine.choices && (
          <ChoiceContainer>
            {currentLine.choices.map((choice, index) => (
              <ChoiceButton 
                key={index}
                onClick={() => handleChoiceSelect(choice)}
              >
                {choice.text}
              </ChoiceButton>
            ))}
          </ChoiceContainer>
        )}
        
        {/* Continue button */}
        {!showChoices && !currentLine.isNameInput && (
          <ContinueButton>
            {currentLineIndex < dialogue.length - 1 ? 'Continue' : 'Begin Day 1'}
          </ContinueButton>
        )}
      </DialogueBox>
      
      <InstructionText>
        {currentLine.isNameInput ? 'Enter your name' : (showChoices ? 'Select a response' : 'Click to continue')}
      </InstructionText>

      {/* Add keyframes for fade-in animation */}
      <style jsx global>{`
        ${fadeInAnimation}
      `}</style>
    </PrologueContainer>
  );
}; 