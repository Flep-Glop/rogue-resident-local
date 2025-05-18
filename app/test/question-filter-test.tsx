'use client';

import React, { useState, useEffect } from 'react';
import { KnowledgeDomain, MentorId } from '../types';
import { Question } from '../types/questions';
import { getAllDomainQuestions } from '../core/questions/questionLoader';
import pixelTheme, { colors, spacing, typography, borders } from '../styles/pixelTheme';

// Component for showing question details for mentors with insufficient questions
const DetailedQuestionList = ({ questions }: { questions: Question[] }) => {
  if (!questions || questions.length === 0) return null;
  
  return (
    <div className="ml-4 text-sm mt-2">
      <p className="font-medium" style={{ color: colors.highlight }}>Question details ({questions.length}):</p>
      <div 
        className="p-3 mt-1 rounded max-h-60 overflow-auto"
        style={{ 
          backgroundColor: colors.backgroundAlt, 
          border: borders.thin,
          fontFamily: typography.fontFamily.pixel,
          fontSize: typography.fontSize.xs,
          color: colors.textDim
        }}
      >
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: borders.thin }}>
              <th className="pr-4 py-2" style={{ color: colors.text }}>ID</th>
              <th className="pr-4 py-2" style={{ color: colors.text }}>Type</th>
              <th className="pr-4 py-2" style={{ color: colors.text }}>Subtopic</th>
              <th className="pr-4 py-2" style={{ color: colors.text }}>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} style={{ borderTop: borders.thin }}>
                <td className="pr-4 py-2">{q.id}</td>
                <td className="pr-4 py-2">{q.type}</td>
                <td className="pr-4 py-2">{q.tags.subtopic}</td>
                <td className="pr-4 py-2">{q.tags.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component for mentor statistics display
const MentorStats = ({ mentorCounts, filteredCounts, mentorDetails }) => {
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);
  
  return (
    <div className="mt-4">
      <h3 
        className="text-xl font-bold mb-2"
        style={{ color: colors.highlight, textShadow: typography.textShadow.pixel }}
      >
        Mentor Statistics
      </h3>
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: colors.backgroundAlt, border: borders.medium }}
      >
        <table className="min-w-full divide-y" style={{ borderColor: colors.border }}>
          <thead style={{ backgroundColor: colors.background }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textDim }}>Mentor</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textDim }}>Raw Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textDim }}>After Filter</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textDim }}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: colors.border }}>
            {Object.values(MentorId).map((mentor: string) => {
              const rawCount = mentorCounts[mentor] || 0;
              const filteredCount = filteredCounts[`${mentor}_filtered`] || 0;
              const isSufficient = filteredCount >= 5;
              const mentorDetailQuestions = mentorDetails[`${mentor}_details`] || [];
              
              return (
                <React.Fragment key={mentor}>
                  <tr 
                    className={`cursor-pointer hover:brightness-125`} 
                    style={{ 
                      backgroundColor: !isSufficient ? colors.error : 'transparent', 
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => !isSufficient && setExpandedMentor(expandedMentor === mentor ? null : mentor)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: colors.text }}>{mentor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.textDim }}>{rawCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.textDim }}>{filteredCount}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isSufficient ? '' : 'font-bold'}`} style={{ color: isSufficient ? colors.active : colors.error }}>
                      {isSufficient ? 'Sufficient' : 'INSUFFICIENT'}
                    </td>
                  </tr>
                  {expandedMentor === mentor && !isSufficient && (
                    <tr style={{ backgroundColor: colors.background }}>
                      <td colSpan={4} className="px-6 py-2">
                        <DetailedQuestionList questions={mentorDetailQuestions} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component for question type distribution
const QuestionTypeStats = ({ typeData }) => {
  return (
    <div className="mt-6">
      <h3 
        className="text-xl font-bold mb-2"
        style={{ color: colors.highlight, textShadow: typography.textShadow.pixel }}
      >
        Question Type Distribution
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(typeData).map(([type, count]) => (
          <div 
            key={type} 
            className="rounded-lg p-4 text-center hover:brightness-110 transition-all"
            style={{ 
              backgroundColor: colors.backgroundAlt, 
              border: borders.medium
            }}
          >
            <div className="text-sm font-medium mb-1" style={{ color: colors.textDim }}>{type}</div>
            <div className="text-3xl font-bold" style={{ color: colors.text }}>{count as number}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for a single domain's data - Apply pixelTheme styling
const DomainSection = ({ domain, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  
  return (
    <div 
      className="mb-8 rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: colors.backgroundAlt, 
        border: borders.medium 
      }}
    >
      <div 
        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:brightness-110"
        style={{ backgroundColor: colors.background }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 className="text-2xl font-bold" style={{ color: colors.text, textShadow: typography.textShadow.pixel }}>{domain}</h2>
        <div className="flex items-center">
          <span className="mr-4 font-medium" style={{ color: colors.textDim }}>
            Total: <span style={{ color: colors.text, fontSize: typography.fontSize.xl }}>{data.totalQuestions}</span>
          </span>
          {/* Replace SVG with text indicator */}
          <span style={{ color: colors.highlight, fontSize: typography.fontSize.lg, marginLeft: spacing.sm }}>
            {isCollapsed ? '[+]' : '[-]'}
          </span>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-6">
          <MentorStats 
            mentorCounts={data.byMentor} 
            filteredCounts={data} // Pass the whole domain data object
            mentorDetails={data} // Pass the whole domain data object for details
          />
          
          <QuestionTypeStats typeData={data.byType} />
        </div>
      )}
    </div>
  );
};

// Main component
export default function QuestionFilterTest() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy Results'); // State for button text

  useEffect(() => {
    async function runTests() {
      try {
        setLoading(true);
        const testResults: Record<string, any> = {};
        
        // Test each domain
        for (const domain of Object.values(KnowledgeDomain)) {
          testResults[domain] = { totalQuestions: 0, byMentor: {}, byType: {} };
          
          const allQuestions = await getAllDomainQuestions(domain);
          testResults[domain].totalQuestions = allQuestions.length;
          
          const mentorCounts: Record<string, number> = {};
          const typeCounts: Record<string, number> = {};
          
          for (const question of allQuestions) {
            const mentor = question.tags.mentor || 'Unknown'; // Default to Unknown if missing
            mentorCounts[mentor] = (mentorCounts[mentor] || 0) + 1;
            
            const type = question.type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
          
          testResults[domain].byMentor = mentorCounts;
          testResults[domain].byType = typeCounts;
          
          // Test each mentor specifically
          for (const mentor of Object.values(MentorId)) {
            const mentorQuestions = allQuestions.filter(q => 
              typeof q.tags.mentor === 'string' && 
              q.tags.mentor.toLowerCase() === mentor.toLowerCase()
            );
            
            testResults[domain][`${mentor}_filtered`] = mentorQuestions.length;
            
            if (mentorQuestions.length < 5) {
              testResults[domain][`${mentor}_details`] = mentorQuestions.map(q => ({
                id: q.id,
                type: q.type,
                tags: q.tags // Include all tags for potential future use or debugging
              }));
            }
          }
        }
        
        setResults(testResults);
      } catch (err) {
        console.error("Error running tests:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    runTests();
  }, []);

  // Function to format results for copying
  const formatResultsForCopy = () => {
    let output = "Question Filter Test Results\n";
    output += "=============================\n\n";

    for (const domain in results) {
      output += `--- ${domain} ---\n`;
      output += `Total Questions: ${results[domain].totalQuestions}\n`;
      
      output += "Mentor Counts (Raw -> Filtered):\n";
      for (const mentor of Object.values(MentorId)) {
        const rawCount = results[domain].byMentor[mentor] || 0;
        const filteredCount = results[domain][`${mentor}_filtered`] || 0;
        const status = filteredCount >= 5 ? 'Sufficient' : 'INSUFFICIENT';
        output += `  ${mentor}: ${rawCount} -> ${filteredCount} (${status})\n`;
      }
      
      output += "\nQuestion Types:\n";
      for (const type in results[domain].byType) {
        output += `  ${type}: ${results[domain].byType[type]}\n`;
      }
      output += "\n";
    }
    return output;
  };

  // Function to handle copying results to clipboard
  const handleCopyResults = async () => {
    const resultsText = formatResultsForCopy();
    try {
      await navigator.clipboard.writeText(resultsText);
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Results'), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy results: ', err);
      setCopyButtonText('Copy Failed');
      setTimeout(() => setCopyButtonText('Copy Results'), 2000);
    }
  };

  if (loading) return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: colors.background, color: colors.text, fontFamily: typography.fontFamily.pixel }}
    >
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mx-auto"
          style={{ borderColor: colors.highlight, borderTopColor: 'transparent' }}
        ></div>
        <p className="mt-6 text-xl" style={{ color: colors.highlight }}>Loading question data...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background, color: colors.text, fontFamily: typography.fontFamily.pixel }}
    >
      <div 
        className="text-center p-8 max-w-md rounded-lg"
        style={{ backgroundColor: colors.backgroundAlt, border: `3px solid ${colors.error}` }}
      >
        <svg className="mx-auto h-16 w-16" style={{ color: colors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h3 className="mt-4 text-xl font-bold" style={{ color: colors.error }}>Error Loading Data</h3>
        <p className="mt-2" style={{ color: colors.textDim }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: colors.background, fontFamily: typography.fontFamily.pixel, color: colors.text }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 
            className="text-4xl font-bold text-center inline-block pb-2"
            style={{ borderBottom: `4px solid ${colors.highlight}`, textShadow: typography.textShadow.pixel }}
          >
            Question Filter Test Results
          </h1>
          {/* Copy Results Button */}
          <button
            onClick={handleCopyResults}
            style={{
              backgroundColor: copyButtonText === 'Copied!' ? colors.active : colors.highlight,
              color: colors.text,
              padding: `${spacing.sm} ${spacing.md}`,
              border: borders.medium,
              borderColor: colors.border,
              borderRadius: '4px',
              fontFamily: typography.fontFamily.pixel,
              fontSize: typography.fontSize.sm,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {copyButtonText}
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {Object.entries(results).map(([domain, data]) => (
            <DomainSection key={domain} domain={domain} data={data} />
          ))}
        </div>
        
        <div 
          className="rounded-lg p-6 mt-8"
          style={{ backgroundColor: colors.backgroundAlt, border: borders.medium }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: colors.highlight, textShadow: typography.textShadow.pixel }}
          >
            Recommendations
          </h2>
          <div className="space-y-4">
            {[
              { text: "Add more questions for mentors with fewer than 5 questions, especially", highlight: "mentors that show as INSUFFICIENT", color: colors.error },
              { text: "Check mentor name capitalization in question JSON files - the case-insensitive filter helps, but consistent naming is better" },
              { text: "Balance question types across mentors - ensure each mentor has multiple question types available" }
            ].map((rec, index) => (
              <div 
                key={index} 
                className="flex items-start p-4 rounded-lg"
                style={{ backgroundColor: colors.background }}
              >
                <div className="flex-shrink-0 mt-1">
                  <span style={{ color: colors.highlight, fontSize: typography.fontSize.md }}>✓</span>
                </div>
                <p className="ml-4" style={{ color: colors.textDim }}>
                  {rec.text} {rec.highlight && 
                    <span style={{ color: rec.color || colors.highlight, fontWeight: 'bold' }}>{rec.highlight}</span>
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 