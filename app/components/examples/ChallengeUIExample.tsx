'use client';

import React, { useState } from 'react';
import ChallengeUI from '../questions/ChallengeUI';
import { ActivityDifficulty, MentorId } from '../../types';
import styled from 'styled-components';

// Sample challenge data
const SAMPLE_CHALLENGE = {
  title: "QA Protocol Review",
  difficulty: ActivityDifficulty.MEDIUM,
  mentor: MentorId.KAPOOR,
  questions: [
    {
      content: "When calibrating a 6 MV photon beam according to TG-51, at what depth is the reference measurement taken?",
      options: [
        {
          text: "dmax (depth of maximum dose)",
          correct: false,
          feedback: "That's not correct. While dmax is important for other measurements, it's not the reference depth for TG-51 calibration."
        },
        {
          text: "5 cm depth",
          correct: false,
          feedback: "Not quite. 5 cm is not the standard reference depth for TG-51 protocol."
        },
        {
          text: "10 cm depth",
          correct: true,
          feedback: "Correct! TG-51 protocol specifies that the reference calibration for photon beams should be performed at 10 cm depth."
        }
      ]
    },
    {
      content: "Which chamber correction factor accounts for the difference between the beam quality used for calibration and the beam quality of the user's beam?",
      options: [
        {
          text: "Pion",
          correct: false,
          feedback: "Incorrect. Pion is the ion recombination correction factor."
        },
        {
          text: "kQ",
          correct: true,
          feedback: "Correct! kQ is the beam quality correction factor that accounts for the difference between the calibration beam quality and the user's beam quality."
        },
        {
          text: "Ptp",
          correct: false,
          feedback: "Incorrect. Ptp is the temperature and pressure correction factor."
        }
      ]
    }
  ]
};

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align items to the top */
  padding: 2rem;
  background-color: #0f172a; /* Match global background */
  min-height: 100vh;
`;

const MainContentContainer = styled.div`
  max-width: 1000px; /* Adjust as needed for wider layout with panels */
  width: 100%;
`;

const PageTitle = styled.h1`
  color: #e5e7eb; /* Light gray title */
  margin-bottom: 1.5rem;
  font-weight: 700; /* Make title bolder */
  font-size: 2rem; /* Increase title size */
  text-align: center;
`;

const ChallengeUIExample: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allAnswers, setAllAnswers] = useState<boolean[]>([]);
  const [usedTangent, setUsedTangent] = useState(false);
  const [usedBoost, setUsedBoost] = useState(false);
  
  const [insight, setInsight] = useState(50);
  const [momentum, setMomentum] = useState(3);
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
    const isCorrect = SAMPLE_CHALLENGE.questions[currentQuestionIndex].options[index].correct;
    setAllAnswers([...allAnswers, isCorrect]);
    if (isCorrect) {
      setInsight(prev => prev + 10);
      setMomentum(prev => Math.min(3, prev + 1));
    } else {
      setMomentum(0);
    }
  };
  
  const handleContinue = () => {
    if (currentQuestionIndex < SAMPLE_CHALLENGE.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      alert("Challenge complete!");
      // Reset for demo purposes
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setAllAnswers([]);
      setUsedTangent(false);
      setUsedBoost(false);
      setInsight(50);
      setMomentum(3);
    }
  };
  
  const handleTangent = () => {
    if (insight >= 25 && !usedTangent) {
      setInsight(prev => prev - 25);
      setUsedTangent(true);
      alert("Tangent used! (Functionality to show alternate question/hint would be here)");
    } else if (usedTangent) {
      alert("Tangent already used for this question set.");
    } else {
      alert("Not enough Insight to use Tangent.");
    }
  };
  
  const handleBoost = () => {
    if (momentum > 0 && !usedBoost) { // Let's say boost needs at least 1 momentum
      // For demo, let's consume 1 momentum for a boost
      setMomentum(prev => prev -1);
      setUsedBoost(true);
      alert("Boost used! (Rewards would be multiplied if correct)");
    } else if (usedBoost) {
      alert("Boost already used for this question.");
    } else {
      alert("Not enough Momentum to use Boost.");
    }
  };
  
  return (
    <PageContainer>
      <MainContentContainer>
        <PageTitle>Challenge UI Example</PageTitle>
        <ChallengeUI
          title={SAMPLE_CHALLENGE.title}
          questions={SAMPLE_CHALLENGE.questions}
          currentQuestionIndex={currentQuestionIndex}
          selectedOption={selectedOption}
          allAnswers={allAnswers}
          difficulty={SAMPLE_CHALLENGE.difficulty}
          mentor={SAMPLE_CHALLENGE.mentor}
          showFeedback={showFeedback}
          usedTangent={usedTangent}
          usedBoost={usedBoost}
          insight={insight}
          momentum={momentum}
          maxMomentum={3} // Pass max momentum for display
          onOptionSelect={handleOptionSelect}
          onContinue={handleContinue}
          onTangent={handleTangent}
          onBoost={handleBoost}
        />
      </MainContentContainer>
    </PageContainer>
  );
};

export default ChallengeUIExample; 