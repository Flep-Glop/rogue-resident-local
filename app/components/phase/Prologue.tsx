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
  nextId?: string;
}

interface DialogueChoice {
  text: string;
  nextId?: string;
  effect?: () => void;
  displayElement?: (text: string) => React.ReactNode;
  isDifficultySelection?: boolean;
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

const BackgroundImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
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

const PlayerName = styled.span`
  color: ${colors.highlight};
  font-weight: bold;
`;

const HospitalName = styled.span`
  color: #4a9eda; /* Blue for the hospital */
  font-weight: bold;
`;

const DrGarciaName = styled.span`
  color: #ff3399; /* Much brighter hot pink for Dr. Garcia */
  font-weight: bold;
  text-shadow: 0 0 1px rgba(255, 51, 153, 0.5);
`;

const DrKapoorName = styled.span`
  color: #e8945e; /* Orange for Dr. Kapoor */
  font-weight: bold;
`;

const DrQuinnName = styled.span`
  color: #5ee89c; /* Green for Dr. Quinn */
  font-weight: bold;
`;

const JesseName = styled.span`
  color: #e85e8f; /* Pink for Jesse */
  font-weight: bold;
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
`;

const ConfirmationBox = styled.div`
  ${components.dialog.container}
  max-width: 500px;
  padding: ${spacing.lg};
`;

const ConfirmationButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.md};
  margin-top: ${spacing.lg};
`;

const ConfirmButton = styled.button`
  ${components.button.base}
  ${components.button.primary}
  padding: ${spacing.xs} ${spacing.md};
`;

const CancelButton = styled.button`
  ${components.button.base}
  background-color: ${colors.inactive};
  padding: ${spacing.xs} ${spacing.md};
`;

const BeginnerModeText = styled.span`
  color: #48bb78; /* green-400 */
  font-weight: bold;
`;

const StandardModeText = styled.span`
  color: #ecc94b; /* yellow-400 */
  font-weight: bold;
`;

const ExpertModeText = styled.span`
  color: #f56565; /* red-400 */
  font-weight: bold;
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  
  // Typewriter effect states
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(30); // milliseconds per character

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
          text: "I'm fresh out of undergrad with a physics degree.",
          displayElement: (text: string) => (
            <>
              {text} <BeginnerModeText>Beginner Mode</BeginnerModeText>
            </>
          ),
          effect: () => {
            setShowConfirmation(true);
            setPendingDifficulty(Difficulty.BEGINNER);
            setConfirmationText("Beginner Mode provides more explanations and a gentler learning curve for those new to medical physics.");
          },
          nextId: "beginner_garcia_response",
          isDifficultySelection: true
        },
        { 
          text: "I just finished my doctorate in medical physics.",
          displayElement: (text: string) => (
            <>
              {text} <StandardModeText>Standard Mode</StandardModeText>
            </>
          ),
          effect: () => {
            setShowConfirmation(true);
            setPendingDifficulty(Difficulty.STANDARD);
            setConfirmationText("Standard Mode offers a balanced challenge suitable for those with a solid foundation in medical physics.");
          },
          nextId: "standard_garcia_response",
          isDifficultySelection: true
        },
        { 
          text: "I practiced medical physics in another country.",
          displayElement: (text: string) => (
            <>
              {text} <ExpertModeText>Expert Mode</ExpertModeText>
            </>
          ),
          effect: () => {
            setShowConfirmation(true);
            setPendingDifficulty(Difficulty.EXPERT);
            setConfirmationText("Expert Mode presents advanced concepts with steeper mastery requirements for experienced professionals.");
          },
          nextId: "expert_garcia_response",
          isDifficultySelection: true
        }
      ],
      id: "background_question"
    },
    { 
      speaker: 'garcia', 
      text: "Excellent! We'll make sure to provide you with plenty of foundational knowledge. You'll have more opportunities for self-study, and we'll take a bit more time with the technical concepts. It's a perfect starting point.",
      id: "beginner_garcia_response",
      nextId: "mentor_intro"
    },
    { 
      speaker: 'garcia', 
      text: "Perfect timing then! You have the theoretical foundation, and now you'll get to see how it applies in practice. We'll balance explanation with application throughout your time here.",
      id: "standard_garcia_response",
      nextId: "mentor_intro"
    },
    { 
      speaker: 'garcia', 
      text: "Fantastic! Your experience will be valuable. We'll be able to move at a quicker pace and focus on advanced topics sooner. I look forward to your international perspective on our methods.",
      id: "expert_garcia_response",
      nextId: "mentor_intro"
    },
    { 
      speaker: 'garcia', 
      text: "You'll work with several mentors: myself, Dr. Kapoor—who believes protocols are sacred texts, Jesse—who can diagnose a linac malfunction from the sound it makes, and Dr. Quinn—whose ideas occasionally bend the laws of physics.",
      id: "mentor_intro"
    },
    { 
      speaker: 'garcia', 
      text: "Time management is crucial here. Unlike subatomic particles, we can't be in two places at once—though Dr. Quinn has a theory about that too. Choose your daily activities wisely."
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
        },
        {
          text: "No, thanks. I'm ready to begin.",
          nextId: "ready_to_begin"
        }
      ],
      id: "first_question"
    },
    { 
      speaker: 'garcia', 
      text: "Each day runs from 8 to 5, with various opportunities throughout. I believe in balance—rigorous science balanced with compassionate care. The schedule may seem rigid, but there's an art to working within it.",
      id: "schedule_question",
      nextId: "more_questions"
    },
    { 
      speaker: 'garcia', 
      text: "It depends on your learning style. Dr. Kapoor is methodical and precise—perfect if you prefer structure. Jesse offers practical, hands-on learning. Dr. Quinn will challenge your conceptual thinking. And I focus on integrating physics with patient care.",
      id: "mentor_question",
      nextId: "more_questions"
    },
    { 
      speaker: 'garcia', 
      text: "Time management is the biggest challenge. Second is connecting theoretical knowledge to practical application. And third is maintaining balance—between technical excellence and patient compassion, between different knowledge domains.",
      id: "struggle_question",
      nextId: "more_questions"
    },
    {
      speaker: 'garcia',
      text: "Do you have any other questions about the residency program?",
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
        },
        {
          text: "No, thanks. I'm ready to begin.",
          nextId: "ready_to_begin"
        }
      ],
      id: "more_questions"
    },
    {
      speaker: 'garcia',
      text: "Excellent! Let's get you started with your first day then, [PLAYER_NAME]. Welcome to Memorial General Hospital's Medical Physics Residency Program.",
      id: "ready_to_begin"
    }
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

  // Reset typewriter effect when dialogue line changes
  useEffect(() => {
    // Reset typewriter
    setDisplayedText('');
    setIsTyping(true);
  }, [currentLineIndex]);

  // Focus the name input field when it appears
  useEffect(() => {
    if (currentLine.isNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentLineIndex, currentLine.isNameInput]);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping || !currentLine.text) return;
    
    // Replace [PLAYER_NAME] immediately instead of showing it character by character
    const processedText = currentLine.text.replace(/\[PLAYER_NAME\]/g, playerNameInput || 'Resident');
    
    if (displayedText.length >= processedText.length) {
      setIsTyping(false);
      
      // Show choices only after typing is complete
      if (currentLine.choices && !showChoices) {
        setShowChoices(true);
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setDisplayedText(processedText.substring(0, displayedText.length + 1));
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [currentLine.text, displayedText, isTyping, typingSpeed, showChoices, playerNameInput, currentLine.choices]);

  // Function to complete the current line's typing animation
  const completeTyping = () => {
    if (isTyping && currentLine.text) {
      const processedText = currentLine.text.replace(/\[PLAYER_NAME\]/g, playerNameInput || 'Resident');
      setDisplayedText(processedText);
      setIsTyping(false);
      
      // If there are choices, show them after typing completes
      if (currentLine.choices && !showChoices) {
        setShowChoices(true);
      }
    }
  };

  // Handle advancing the dialogue
  const advanceDialogue = () => {
    // If text is still typing, complete it first
    if (isTyping) {
      completeTyping();
      return;
    }
    
    // Handle name input special case
    if (currentLine.isNameInput) {
      if (playerNameInput.trim()) {
        // Save the player name to the game store
        setPlayerName(playerNameInput.trim());
        setCurrentLineIndex(currentLineIndex + 1);
        setFadeKey(prevKey => prevKey + 1);
        setShowChoices(false); // Reset choices when moving to next dialogue
      }
      return;
    }

    // If we have choices but they're not shown yet, let the useEffect handle showing them
    // after typing completes, so don't do anything here
    if (currentLine.choices && !showChoices) {
      return;
    }

    // Check if the current line has a nextId to direct flow
    if (currentLine.nextId && dialogueMap[currentLine.nextId] !== undefined) {
      setCurrentLineIndex(dialogueMap[currentLine.nextId]);
      setFadeKey(prevKey => prevKey + 1);
      setShowChoices(false);
      return; // Return early to prevent advancing to the next dialogue line
    }

    // If no nextId is specified, just move to the next line
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
    // Execute the effect if present
    if (choice.effect) {
      choice.effect();
    }
    
    // If this is a difficulty selection, don't advance the dialogue at all
    if (choice.isDifficultySelection) {
      return; // Just show the confirmation modal and stop
    }
    
    // If we're showing any confirmation modal, don't advance dialogue
    if (showConfirmation) {
      return;
    }
    
    // Track the selected choice
    if (currentLine.id) {
      setSelectedChoices(prev => ({
        ...prev,
        [currentLine.id]: choice.text
      }));
    }
    
    // Check if this choice directs to a specific node
    if (choice.nextId && dialogueMap[choice.nextId] !== undefined) {
      setCurrentLineIndex(dialogueMap[choice.nextId]);
      setFadeKey(prevKey => prevKey + 1);
      setShowChoices(false);
      return; // Return early to prevent advancing to the next dialogue line
    }
    
    // Otherwise just move to the next line
    setCurrentLineIndex(currentLineIndex + 1);
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

  // Function to show difficulty confirmation dialog
  const showDifficultyConfirmation = (difficulty: Difficulty) => {
    setShowConfirmation(true);
    setPendingDifficulty(difficulty);
    
    let explanationText = '';
    switch(difficulty) {
      case Difficulty.BEGINNER:
        explanationText = "Beginner Mode provides more explanations and a gentler learning curve for those new to medical physics.";
        break;
      case Difficulty.STANDARD:
        explanationText = "Standard Mode offers a balanced challenge suitable for those with a solid foundation in medical physics.";
        break;
      case Difficulty.EXPERT:
        explanationText = "Expert Mode presents advanced concepts with steeper mastery requirements for experienced professionals.";
        break;
    }
    
    setConfirmationText(explanationText);
  };
  
  const confirmDifficulty = () => {
    setShowConfirmation(false);
    
    // Actually set the difficulty now that it's confirmed
    if (pendingDifficulty !== null) {
      setDifficulty(pendingDifficulty);
      
      // Find the dialogue line with the appropriate nextId based on the chosen difficulty
      const chosenNextId = 
        pendingDifficulty === Difficulty.BEGINNER ? "beginner_garcia_response" :
        pendingDifficulty === Difficulty.STANDARD ? "standard_garcia_response" :
        "expert_garcia_response";
      
      // Now advance to the appropriate response
      if (chosenNextId && dialogueMap[chosenNextId] !== undefined) {
        setCurrentLineIndex(dialogueMap[chosenNextId]);
        setFadeKey(prevKey => prevKey + 1);
        setShowChoices(false);
      }
    }
  };
  
  const cancelDifficultySelection = () => {
    setShowConfirmation(false);
    setPendingDifficulty(null);
  };

  // Define animation for text fadeIn
  const fadeInAnimation = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  // Function to apply colored styling to names without partial text display
  const getStyledText = (text: string) => {
    // Replace colored names
    let styledText = text;
    
    // Replace Dr. Garcia with styled version
    styledText = styledText.replace(/Dr\. Garcia/g, (match) => {
      return `<dr-garcia>${match}</dr-garcia>`;
    });
    
    // Replace Dr. Kapoor with styled version
    styledText = styledText.replace(/Dr\. Kapoor/g, (match) => {
      return `<dr-kapoor>${match}</dr-kapoor>`;
    });
    
    // Replace Dr. Quinn with styled version
    styledText = styledText.replace(/Dr\. Quinn/g, (match) => {
      return `<dr-quinn>${match}</dr-quinn>`;
    });
    
    // Replace Memorial General Hospital with styled version
    styledText = styledText.replace(/Memorial General Hospital/g, (match) => {
      return `<hospital>${match}</hospital>`;
    });
    
    // Replace Jesse with styled version
    styledText = styledText.replace(/\bJesse\b/g, (match) => {
      return `<jesse>${match}</jesse>`;
    });
    
    // Split by custom tags and create React elements
    const parts = [];
    let remaining = styledText;
    
    while (remaining.length > 0) {
      // Find the first tag
      const tagMatch = remaining.match(/<(dr-garcia|dr-kapoor|dr-quinn|hospital|jesse)>(.*?)<\/\1>/);
      
      if (!tagMatch) {
        // No more tags, add the remaining text
        parts.push(remaining);
        break;
      }
      
      // Add text before the tag
      const beforeTag = remaining.substring(0, tagMatch.index);
      if (beforeTag) {
        parts.push(beforeTag);
      }
      
      // Add the styled element based on tag type
      const [fullMatch, tagType, content] = tagMatch;
      
      switch (tagType) {
        case 'dr-garcia':
          parts.push(<DrGarciaName key={`garcia-${Math.random()}`}>{content}</DrGarciaName>);
          break;
        case 'dr-kapoor':
          parts.push(<DrKapoorName key={`kapoor-${Math.random()}`}>{content}</DrKapoorName>);
          break;
        case 'dr-quinn':
          parts.push(<DrQuinnName key={`quinn-${Math.random()}`}>{content}</DrQuinnName>);
          break;
        case 'hospital':
          parts.push(<HospitalName key={`hospital-${Math.random()}`}>{content}</HospitalName>);
          break;
        case 'jesse':
          parts.push(<JesseName key={`jesse-${Math.random()}`}>{content}</JesseName>);
          break;
      }
      
      // Update remaining text
      remaining = remaining.substring(tagMatch.index! + fullMatch.length);
    }
    
    return <>{parts}</>;
  };

  return (
    <PrologueContainer>
      {/* Hospital background - positioned above the gradient background but below character */}
      <BackgroundOverlay>
        <BackgroundImage>
          <Image 
            src="/images/hospital.png" 
            alt="Hospital" 
            fill
            className="object-cover"
            priority
          />
        </BackgroundImage>
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
        $isNameInput={currentLine.isNameInput && !isTyping}
        $showChoices={showChoices}
        onClick={(!currentLine.isNameInput && !showChoices) ? advanceDialogue : undefined}
      >
        <DialogueHeader>
          Dr. Garcia
        </DialogueHeader>
        
        <DialogueContent key={fadeKey}>
          {getStyledText(displayedText)}
          {isTyping && <span className="cursor">|</span>}
        </DialogueContent>
        
        {/* Name input form - only show after typing is complete */}
        {currentLine.isNameInput && !isTyping && (
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
                {'displayElement' in choice ? 
                  choice.displayElement(choice.text) : 
                  choice.text}
              </ChoiceButton>
            ))}
          </ChoiceContainer>
        )}
        
        {/* Continue button - only show when typing is complete */}
        {!showChoices && !currentLine.isNameInput && !isTyping && (
          <ContinueButton>
            {currentLineIndex < dialogue.length - 1 ? 'Continue' : 'Begin Day 1'}
          </ContinueButton>
        )}
      </DialogueBox>
      
      <InstructionText>
        {currentLine.isNameInput && !isTyping ? 'Enter your name' : 
         (showChoices ? 'Select a response' : 
          (isTyping ? 'Click to speed up text' : 'Click to continue'))}
      </InstructionText>

      {showConfirmation && (
        <ConfirmationModal>
          <ConfirmationBox>
            <DialogueHeader>Confirm Difficulty</DialogueHeader>
            <DialogueContent>
              {confirmationText}
            </DialogueContent>
            <ConfirmationButtons>
              <CancelButton onClick={cancelDifficultySelection}>Go Back</CancelButton>
              <ConfirmButton onClick={confirmDifficulty}>Confirm</ConfirmButton>
            </ConfirmationButtons>
          </ConfirmationBox>
        </ConfirmationModal>
      )}

      {/* Add keyframes for fade-in and blinking cursor animations */}
      <style jsx global>{`
        ${fadeInAnimation}
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .cursor {
          display: inline-block;
          animation: blink 0.8s infinite;
          color: ${colors.highlight};
        }
      `}</style>
    </PrologueContainer>
  );
}; 