'use client';

import React from 'react';
import styled from 'styled-components';
import { ActivityDifficulty, MentorId } from '../../types';

// Types (assuming these are defined elsewhere, like in ../../types)
// export enum ActivityDifficulty { EASY = "EASY", MEDIUM = "MEDIUM", HARD = "HARD" }
// export enum MentorId { KAPOOR = "KAPOOR", JESSE = "JESSE", GARCIA = "GARCIA", QUINN = "QUINN" }

interface Option {
  text: string;
  correct: boolean;
  feedback: string;
}

interface ChallengeProps {
  title: string;
  questions: Array<{
    content: string;
    options: Option[];
  }>;
  currentQuestionIndex: number;
  selectedOption: number | null;
  allAnswers: boolean[];
  difficulty: ActivityDifficulty;
  mentor: MentorId;
  showFeedback: boolean;
  usedTangent: boolean;
  usedBoost: boolean;
  insight: number;
  momentum: number;
  maxMomentum: number;
  onOptionSelect: (index: number) => void;
  onContinue: () => void;
  onTangent: () => void;
  onBoost: () => void;
}

// Styled Components
const OverallContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  background-color: rgba(17, 24, 39, 0.9); /* Main container bg */
  border-radius: 10px; /* Slightly smaller radius */
  padding: 1.5rem;
  border: 1px solid #2c3a50; /* Softer border */
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  max-width: 1000px;
  margin: auto;
  font-family: 'VT323', monospace; /* Ensure VT323 is primary */
`;

const Panel = styled.div`
  background-color: rgba(30, 41, 59, 0.8); /* Panel bg */
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #374151; /* Consistent border */
  box-shadow: 0 2px 4px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MentorPanelContainer = styled(Panel)`
  flex: 0 0 180px;
`;

const PlayerPanelContainer = styled(Panel)`
  flex: 0 0 180px;
`;

const MainChallengeArea = styled.div`
  flex-grow: 1;
  background-color: rgba(23, 30, 45, 0.75); /* Main area bg */
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #374151;
`;

const PanelTitle = styled.h2`
  font-size: 1.6rem; /* VT323 might need larger sizes */
  color: #94a3b8; /* slate-400 for panel titles */
  margin-top: 0;
  margin-bottom: 1rem;
  font-weight: normal; /* VT323 is often bold by default */
  border-bottom: 1px solid #4b5563;
  padding-bottom: 0.5rem;
  width: 100%;
`;

const MentorAvatar = styled.div<{ mentor: MentorId }>`
  width: 70px; /* Adjusted size */
  height: 70px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.mentor) {
      case MentorId.KAPOOR: return '#ec4899';
      case MentorId.JESSE: return '#f59e0b';
      case MentorId.GARCIA: return '#10b981';
      case MentorId.QUINN: return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: normal;
  font-size: 2.8rem; /* Adjusted for VT323 */
  margin-bottom: 0.75rem;
  border: 2px solid rgba(226, 232, 240, 0.4); /* slate-200 border */
  box-shadow: 0 0 8px rgba(0,0,0,0.25);
`;

const MentorName = styled.span`
  font-weight: normal;
  color: #cbd5e1; /* slate-300 */
  font-size: 1.3rem; /* Adjusted for VT323 */
`;

const ResourceDisplay = styled.div`
  margin-bottom: 1rem;
  width: 100%;
  text-align: left; /* Align resource text left */
`;

const ResourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  font-size: 1.15rem; /* Adjusted for VT323 */
  color: #cbd5e1; /* slate-300 */
`;

const ResourceLabel = styled.span`
  font-weight: normal;
  color: #94a3b8; /* slate-400 */
`;

const ResourceValue = styled.span`
  color: #e2e8f0; /* slate-200, brighter for value */
`;

// ... (QuestionHeader, ProgressInfo, ProgressText, ProgressDots, ProgressDot - might be reused or adapted)
const QuestionHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(75, 85, 99, 0.4);
`;

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const ProgressText = styled.span`
  font-size: 1.1rem; /* Adjusted for VT323 */
  color: #94a3b8; /* slate-400 */
  font-weight: normal;
`;

const ProgressDots = styled.div`
  display: flex;
  gap: 6px;
`;

const ProgressDot = styled.span<{ $correct?: boolean; $incorrect?: boolean; $empty?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : 
    '#4b5563'};
  transition: background-color 0.3s ease;
`;


const QuestionContent = styled.div`
  background-color: rgba(30, 41, 59, 0.7);
  padding: 1.25rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  border: 1px solid #4b5563;
`;

const QuestionText = styled.h3`
  font-size: 1.3rem; /* Adjusted for VT323 */
  color: #e2e8f0; /* slate-200 for question */
  margin: 0;
  line-height: 1.5;
  font-weight: normal;
`;

const DifficultyBadge = styled.span<{ difficulty: ActivityDifficulty }>`
  display: inline-block;
  font-size: 0.9rem; /* Adjusted for VT323 */
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  margin-left: 0.75rem;
  background-color: ${props => {
    switch (props.difficulty) {
      case ActivityDifficulty.EASY: return 'rgba(16, 185, 129, 0.3)';
      case ActivityDifficulty.MEDIUM: return 'rgba(245, 158, 11, 0.3)';
      case ActivityDifficulty.HARD: return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(75, 85, 99, 0.3)';
    }
  }};
  color: ${props => {
    switch (props.difficulty) {
      case ActivityDifficulty.EASY: return '#6ee7b7'; /* lighter green */
      case ActivityDifficulty.MEDIUM: return '#fcd34d'; /* lighter yellow */
      case ActivityDifficulty.HARD: return '#fca5a5'; /* lighter red */
      default: return '#9ca3af';
    }
  }};
  font-weight: normal;
  vertical-align: middle;
  border: 1px solid ${props => {
    switch (props.difficulty) {
      case ActivityDifficulty.EASY: return 'rgba(16, 185, 129, 0.6)';
      case ActivityDifficulty.MEDIUM: return 'rgba(245, 158, 11, 0.6)';
      case ActivityDifficulty.HARD: return 'rgba(239, 68, 68, 0.6)';
      default: return 'rgba(75, 85, 99, 0.6)';
    }
  }};
`;

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.25rem;
`;

const OptionButton = styled.button<{ 
  $selected?: boolean; 
  $correct?: boolean; 
  $incorrect?: boolean; 
  disabled?: boolean 
}>`
  padding: 0.8rem 1rem;
  background-color: ${props => 
    props.$correct ? 'rgba(16, 185, 129, 0.3)' : 
    props.$incorrect ? 'rgba(239, 68, 68, 0.3)' : 
    props.$selected ? 'rgba(59, 130, 246, 0.3)' : 
    'rgba(40, 51, 69, 0.8)'
  };
  border: 1px solid ${props => 
    props.$correct ? '#10b981' : 
    props.$incorrect ? '#ef4444' : 
    props.$selected ? '#3b82f6' : 
    '#5b657e'
  };
  border-radius: 4px; /* Sharper radius for pixel feel */
  color: #cbd5e1; /* slate-300 for option text */
  text-align: left;
  transition: all 0.15s ease-in-out;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  font-size: 1.15rem; /* Adjusted for VT323 */
  display: flex;
  align-items: center;
  width: 100%;
  font-weight: normal;
  
  &:hover {
    background-color: ${props => props.disabled ? '' :
    (props.$correct ? 'rgba(16, 185, 129, 0.35)' : 
     props.$incorrect ? 'rgba(239, 68, 68, 0.35)' : 
     props.$selected ? 'rgba(59, 130, 246, 0.35)' : 
     'rgba(59, 130, 246, 0.25)') 
    };
    border-color: ${props => props.disabled ? '' : '#60a5fa'}; /* brighter blue on hover */
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
  }
`;

const OptionIcon = styled.div<{ $correct?: boolean; $incorrect?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 3px; /* More pixelated icon shape */
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: normal;
  font-size: 1.2rem; /* Larger icon char if using text */
  line-height: 1; /* Ensure icon char is centered */
  background-color: ${props => 
    props.$correct ? 'rgba(16, 185, 129, 0.4)' : 
    props.$incorrect ? 'rgba(239, 68, 68, 0.4)' : 
    'rgba(75, 85, 99, 0.4)'
  };
  color: #e2e8f0; /* slate-200 */
  flex-shrink: 0;
`;

const OptionText = styled.span`
  font-size: 1.1rem; /* Adjusted for VT323 */
  line-height: 1.4;
  font-weight: normal;
  color: #cbd5e1; /* slate-300 */
`;

const FeedbackContainer = styled.div<{ $correct: boolean }>`
  margin-top: 1.25rem;
  padding: 1.25rem;
  background-color: ${props => props.$correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border: 1px solid ${props => props.$correct ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
  border-radius: 6px;
  color: #cbd5e1; /* slate-300 */
  font-size: 1.1rem; /* Adjusted for VT323 */
`;

const FeedbackTitle = styled.p<{ $correct: boolean }>`
  font-weight: normal;
  margin-top: 0;
  margin-bottom: 0.6rem;
  color: ${props => props.$correct ? '#6ee7b7' : '#fca5a5'};
  font-size: 1.3rem; /* Adjusted for VT323 */
`;

const FeedbackText = styled.p`
  margin: 0;
  margin-bottom: 0.85rem;
  font-size: 1.1rem; /* Adjusted for VT323 */
  line-height: 1.5;
  color: #cbd5e1; /* slate-300 */
`;

const CorrectAnswerBox = styled.div`
  margin-top: 0.85rem; 
  padding: 0.75rem;
  background-color: rgba(16, 185, 129, 0.15);
  border-radius: 4px;
  border-left: 3px solid #10b981;
`;

const CorrectAnswerTitle = styled.p`
  margin: 0;
  font-weight: normal;
  font-size: 1rem; /* Adjusted for VT323 */
  color: #6ee7b7;
`;

const CorrectAnswerText = styled.p`
  margin: 0.3rem 0 0 0;
  font-size: 1.1rem; /* Adjusted for VT323 */
  color: #cbd5e1; /* slate-300 */
`;

// Special Actions are now in Player Panel
const SpecialActionButton = styled.button<{ $type: 'tangent' | 'boost'; disabled?: boolean }>`
  width: 100%;
  padding: 0.8rem 0.875rem;
  background-color: ${props => 
    props.disabled ? 'rgba(75, 85, 99, 0.3)' : 
    props.$type === 'tangent' ? 'rgba(139, 92, 246, 0.3)' : 
    'rgba(245, 158, 11, 0.3)'
  };
  border: 1px solid ${props => 
    props.disabled ? '#4b5563' : 
    props.$type === 'tangent' ? '#8b5cf6' : 
    '#f59e0b'
  };
  border-radius: 4px; /* Sharper radius */
  color: ${props => props.disabled ? '#94a3b8' : '#e2e8f0'}; /* slate-400 disabled, slate-200 active */
  font-size: 1.1rem; /* Adjusted for VT323 */
  font-weight: normal;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  
  &:hover:not(:disabled) {
    background-color: ${props => 
      props.$type === 'tangent' ? 'rgba(139, 92, 246, 0.4)' : 
      'rgba(245, 158, 11, 0.4)'
    };
    border-color: ${props => 
      props.$type === 'tangent' ? '#a78bfa' :  /* lighter purple */
      '#fbbf24'}; /* lighter orange */
    transform: translateY(-1px);
  }
`;

const ActionIcon = styled.span`
  font-size: 1.3rem; /* Adjusted for VT323 */
  line-height: 1;
`;

const ContinueButton = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: rgba(59, 130, 246, 0.35);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #e2e8f0; /* slate-200 */
  font-weight: normal;
  font-size: 1.2rem; /* Adjusted for VT323 */
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  margin-top: 1rem;
  width: 100%;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.5);
    border-color: #60a5fa; /* Lighter blue */
    transform: translateY(-1px);
  }
`;

// Helper function for mentor data
const getMentorInitial = (mentorId: MentorId): string => {
  switch (mentorId) {
    case MentorId.KAPOOR: return 'K';
    case MentorId.JESSE: return 'J';
    case MentorId.GARCIA: return 'G';
    case MentorId.QUINN: return 'Q';
    default: return 'M';
  }
};

const getMentorName = (mentorId: MentorId): string => {
  switch (mentorId) {
    case MentorId.KAPOOR: return 'Dr. Kapoor';
    case MentorId.JESSE: return 'Technician Jesse';
    case MentorId.GARCIA: return 'Dr. Garcia';
    case MentorId.QUINN: return 'Dr. Quinn';
    default: return 'Mentor';
  }
};

const ChallengeUI: React.FC<ChallengeProps> = ({
  questions,
  currentQuestionIndex,
  selectedOption,
  allAnswers,
  difficulty,
  mentor,
  showFeedback,
  usedTangent,
  usedBoost,
  insight,
  momentum,
  maxMomentum,
  onOptionSelect,
  onContinue,
  onTangent,
  onBoost
}) => {
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <OverallContainer>
      <MentorPanelContainer>
        <PanelTitle>Mentor</PanelTitle>
        <MentorAvatar mentor={mentor}>
          {getMentorInitial(mentor)}
        </MentorAvatar>
        <MentorName>{getMentorName(mentor)}</MentorName>
      </MentorPanelContainer>

      <MainChallengeArea>
        {questions.length > 1 && (
          <QuestionHeader>
            <ProgressInfo>
              <ProgressText>
                Question {currentQuestionIndex + 1} of {questions.length}
              </ProgressText>
              <ProgressDots>
                {allAnswers.map((isCorrect, index) => (
                  <ProgressDot 
                    key={index} 
                    $correct={isCorrect} 
                    $incorrect={!isCorrect && index < allAnswers.length} 
                  />
                ))}
                {Array(questions.length - allAnswers.length).fill(0).map((_, index) => (
                  <ProgressDot key={`empty-${index}`} $empty />
                ))}
              </ProgressDots>
            </ProgressInfo>
          </QuestionHeader>
        )}
        
        <QuestionContent>
          <QuestionText>
            {currentQuestion.content}
            <DifficultyBadge difficulty={difficulty}>
              {difficulty}
            </DifficultyBadge>
          </QuestionText>
        </QuestionContent>
        
        <OptionsList>
          {currentQuestion.options.map((option, index) => (
            <OptionButton
              key={index}
              $selected={selectedOption === index}
              $correct={showFeedback && option.correct}
              $incorrect={showFeedback && selectedOption === index && !option.correct}
              disabled={showFeedback}
              onClick={() => onOptionSelect(index)}
            >
              <OptionIcon 
                $correct={showFeedback && option.correct}
                $incorrect={showFeedback && selectedOption === index && !option.correct}
              >
                {showFeedback ? 
                  (option.correct ? '✓' : (selectedOption === index ? '✗' : '')) : 
                  String.fromCharCode(65 + index)} 
              </OptionIcon>
              <OptionText>{option.text}</OptionText>
            </OptionButton>
          ))}
        </OptionsList>
        
        {showFeedback && selectedOption !== null && (
          <FeedbackContainer $correct={currentQuestion.options[selectedOption].correct}>
            <FeedbackTitle $correct={currentQuestion.options[selectedOption].correct}>
              {currentQuestion.options[selectedOption].correct ? 'Correct!' : 'Incorrect'}
            </FeedbackTitle>
            <FeedbackText>{currentQuestion.options[selectedOption].feedback}</FeedbackText>
            
            {!currentQuestion.options[selectedOption].correct && (
              <CorrectAnswerBox>
                <CorrectAnswerTitle>Correct answer:</CorrectAnswerTitle>
                <CorrectAnswerText>
                  {currentQuestion.options.find(opt => opt.correct)?.text}
                </CorrectAnswerText>
              </CorrectAnswerBox>
            )}
            
            <ContinueButton onClick={onContinue}>
              Continue
            </ContinueButton>
          </FeedbackContainer>
        )}
      </MainChallengeArea>

      <PlayerPanelContainer>
        <PanelTitle>Player HQ</PanelTitle>
        <ResourceDisplay>
          <ResourceItem>
            <ResourceLabel>Insight:</ResourceLabel>
            <ResourceValue>{insight}</ResourceValue>
          </ResourceItem>
          <ResourceItem>
            <ResourceLabel>Momentum:</ResourceLabel>
            <ResourceValue>{momentum} / {maxMomentum}</ResourceValue>
          </ResourceItem>
        </ResourceDisplay>

        {!showFeedback && (
          <>
            <SpecialActionButton 
              $type="tangent"
              onClick={onTangent}
              disabled={usedTangent || insight < 25} 
            >
              <ActionIcon role="img" aria-label="Tangent">!</ActionIcon> {/* Changed Icon for better pixel look */}
              Tangent
            </SpecialActionButton>
            
            <SpecialActionButton 
              $type="boost"
              onClick={onBoost}
              disabled={usedBoost || momentum <= 0} 
            >
              <ActionIcon role="img" aria-label="Boost">★</ActionIcon> {/* Changed Icon for better pixel look */}
              Boost
            </SpecialActionButton>
          </>
        )}
      </PlayerPanelContainer>
    </OverallContainer>
  );
};

export default ChallengeUI; 