import React from 'react';
import { GameEventType } from '@/app/core/events/EventTypes';
import { useEventBus } from '@/app/core/events/CentralEventBus';

const FeedbackSystemTester: React.FC = () => {
  const eventBus = useEventBus();
  
  const testMessageEvent = () => {
    eventBus.dispatch({
      type: GameEventType.FEEDBACK_MESSAGE,
      payload: {
        message: 'Test feedback message',
        type: 'info',
        duration: 3000
      },
      source: 'FeedbackSystemTester'
    });
  };
  
  const testInsightGained = () => {
    eventBus.dispatch({
      type: GameEventType.INSIGHT_GAINED,
      payload: {
        amount: 1,
        source: 'Test'
      },
      source: 'FeedbackSystemTester'
    });
  };
  
  const testMomentumGained = () => {
    eventBus.dispatch({
      type: GameEventType.MOMENTUM_INCREASED,
      payload: {
        amount: 1,
        source: 'Test'
      },
      source: 'FeedbackSystemTester'
    });
  };
  
  const testKnowledgeDiscovered = () => {
    eventBus.dispatch({
      type: GameEventType.KNOWLEDGE_DISCOVERED,
      payload: {
        conceptId: 'test-concept',
        conceptName: 'Test Concept'
      },
      source: 'FeedbackSystemTester'
    });
  };

  return (
    <div className="fixed bottom-0 right-0 mb-4 mr-4 z-50 bg-slate-800 p-2 rounded shadow-lg text-xs">
      <div className="text-center font-bold mb-2">Feedback Tester</div>
      <div className="flex flex-col gap-1">
        <button 
          onClick={testMessageEvent}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
        >
          Test Message
        </button>
        <button 
          onClick={testInsightGained}
          className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded"
        >
          Test Insight
        </button>
        <button 
          onClick={testMomentumGained}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
        >
          Test Momentum
        </button>
        <button 
          onClick={testKnowledgeDiscovered}
          className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
        >
          Test Knowledge
        </button>
      </div>
    </div>
  );
};

export default FeedbackSystemTester; 