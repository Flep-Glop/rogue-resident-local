'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  PixelContainer, 
  QuestionContainer, 
  CardContainer, 
  DialogContainer,
  PanelContainer,
  AbilityContainer,
  ExpandableDialogContainer,
  ExpandableQuestionContainer 
} from '../components/ui/PixelContainer';

const DemoPage = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 1rem;
  font-family: 'VT323', monospace;
  font-size: 14px;
  overflow-y: auto;
`;

const DemoSection = styled.section`
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const SectionTitle = styled.h2`
  color: #f8fafc;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
`;

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DemoDescription = styled.p`
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const VariantDemo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const VariantLabel = styled.h3`
  color: #e2e8f0;
  font-size: 1rem;
  margin: 0;
`;

const StateToggle = styled.button`
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #e2e8f0;
  padding: 0.25rem 0.5rem;
  margin: 0.125rem;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.5);
  }

  &.active {
    background: #3b82f6;
    color: white;
  }
`;

export default function PixelContainerDemoPage() {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [selectedDomains, setSelectedDomains] = useState<Record<string, string>>({
    question: 'physics',
    card: 'dosimetry',
    dialog: 'linac',
    panel: 'planning',
    ability: 'physics'
  });

  const toggleState = (key: string) => {
    setActiveStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setDomain = (container: string, domain: string) => {
    setSelectedDomains(prev => ({ ...prev, [container]: domain }));
  };

  const domains = ['physics', 'dosimetry', 'linac', 'planning'];

  return (
    <DemoPage>
      <DemoSection>
        <SectionTitle>🎨 Pixel Container System Demo</SectionTitle>
        <DemoDescription>
          Explore the modular pixel art container system. Toggle states and domains below.
        </DemoDescription>
      </DemoSection>

      {/* Container Variants Showcase */}
      <DemoSection>
        <SectionTitle>Container Variants</SectionTitle>
        <DemoGrid>
          {/* Question Container */}
          <VariantDemo>
            <VariantLabel>Question</VariantLabel>
            <div>
              {domains.map(domain => (
                <StateToggle
                  key={domain}
                  className={selectedDomains.question === domain ? 'active' : ''}
                  onClick={() => setDomain('question', domain)}
                >
                  {domain}
                </StateToggle>
              ))}
            </div>
            <StateToggle
              className={activeStates.question ? 'active' : ''}
              onClick={() => toggleState('question')}
            >
              {activeStates.question ? 'Active' : 'Normal'}
            </StateToggle>
            <QuestionContainer
              size="sm"
              domain={selectedDomains.question as any}
              isActive={activeStates.question}
              style={{ width: '180px', height: '80px' }}
            >
              <div style={{ color: 'white', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem' }}>
                <strong>Physics Question</strong><br />
                What is a linear accelerator?
              </div>
            </QuestionContainer>
          </VariantDemo>

          {/* Card Container */}
          <VariantDemo>
            <VariantLabel>Card</VariantLabel>
            <div>
              {domains.map(domain => (
                <StateToggle
                  key={domain}
                  className={selectedDomains.card === domain ? 'active' : ''}
                  onClick={() => setDomain('card', domain)}
                >
                  {domain}
                </StateToggle>
              ))}
            </div>
            <StateToggle
              className={activeStates.card ? 'active' : ''}
              onClick={() => toggleState('card')}
            >
              {activeStates.card ? 'Active' : 'Normal'}
            </StateToggle>
            <CardContainer
              size="sm"
              domain={selectedDomains.card as any}
              isActive={activeStates.card}
              onClick={() => console.log('Card clicked!')}
              style={{ width: '140px', height: '60px' }}
            >
              <div style={{ color: 'white', textAlign: 'center', fontSize: '0.8rem' }}>
                <strong>Option A</strong><br />
                Radiation therapy
              </div>
            </CardContainer>
          </VariantDemo>

          {/* Dialog Container */}
          <VariantDemo>
            <VariantLabel>Dialog</VariantLabel>
            <div>
              {domains.map(domain => (
                <StateToggle
                  key={domain}
                  className={selectedDomains.dialog === domain ? 'active' : ''}
                  onClick={() => setDomain('dialog', domain)}
                >
                  {domain}
                </StateToggle>
              ))}
            </div>
            <StateToggle
              className={activeStates.dialog ? 'active' : ''}
              onClick={() => toggleState('dialog')}
            >
              {activeStates.dialog ? 'Active' : 'Normal'}
            </StateToggle>
            <DialogContainer
              size="sm"
              domain={selectedDomains.dialog as any}
              isActive={activeStates.dialog}
              style={{ width: '180px', height: '70px' }}
            >
              <div style={{ color: 'white', padding: '0.5rem', fontSize: '0.8rem' }}>
                <strong>Dr. Garcia:</strong><br />
                "Welcome to the lab!"
              </div>
            </DialogContainer>
          </VariantDemo>

          {/* Panel Container */}
          <VariantDemo>
            <VariantLabel>Panel</VariantLabel>
            <div>
              {domains.map(domain => (
                <StateToggle
                  key={domain}
                  className={selectedDomains.panel === domain ? 'active' : ''}
                  onClick={() => setDomain('panel', domain)}
                >
                  {domain}
                </StateToggle>
              ))}
            </div>
            <StateToggle
              className={activeStates.panel ? 'active' : ''}
              onClick={() => toggleState('panel')}
            >
              {activeStates.panel ? 'Active' : 'Normal'}
            </StateToggle>
            <PanelContainer
              size="sm"
              domain={selectedDomains.panel as any}
              isActive={activeStates.panel}
              style={{ width: '120px', height: '80px' }}
            >
              <div style={{ color: 'white', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem' }}>
                <strong>Resources</strong><br />
                Insight: 75<br />
                Stars: 20
              </div>
            </PanelContainer>
          </VariantDemo>

          {/* Ability Container */}
          <VariantDemo>
            <VariantLabel>Ability</VariantLabel>
            <div>
              {domains.map(domain => (
                <StateToggle
                  key={domain}
                  className={selectedDomains.ability === domain ? 'active' : ''}
                  onClick={() => setDomain('ability', domain)}
                >
                  {domain}
                </StateToggle>
              ))}
            </div>
            <StateToggle
              className={activeStates.ability ? 'active' : ''}
              onClick={() => toggleState('ability')}
            >
              {activeStates.ability ? 'Active' : 'Normal'}
            </StateToggle>
            <AbilityContainer
              size="xs"
              domain={selectedDomains.ability as any}
              isActive={activeStates.ability}
              onClick={() => console.log('Ability activated!')}
              style={{ width: '100px', height: '70px' }}
            >
              <div style={{ color: 'white', textAlign: 'center', padding: '0.25rem', fontSize: '0.7rem' }}>
                <strong>⚡ Focus</strong><br />
                <small>15 Insight</small>
              </div>
            </AbilityContainer>
          </VariantDemo>
        </DemoGrid>
      </DemoSection>

      {/* Size Variations */}
      <DemoSection>
        <SectionTitle>Size Variations</SectionTitle>
        <DemoDescription>
          All containers support 5 size presets: xs, sm, md, lg, xl
        </DemoDescription>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'end', flexWrap: 'wrap' }}>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
            <VariantDemo key={size}>
              <VariantLabel style={{ fontSize: '0.8rem' }}>{size.toUpperCase()}</VariantLabel>
              <CardContainer size={size} domain="physics">
                <div style={{ color: 'white', textAlign: 'center', fontSize: '0.7rem' }}>
                  {size}
                </div>
              </CardContainer>
            </VariantDemo>
          ))}
        </div>
      </DemoSection>

      {/* Working Containers */}
      <DemoSection>
        <SectionTitle>✅ Working Containers</SectionTitle>
        <DemoDescription>
          These containers are working with your new sprites!
        </DemoDescription>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <CardContainer size="md" domain="physics">
            <div style={{ color: 'white', padding: '0.5rem', fontSize: '0.8rem' }}>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#60a5fa' }}>🎨 Visual Consistency</h4>
              <p style={{ margin: 0, fontSize: '0.7rem' }}>
                All containers use unified pixel art style.
              </p>
            </div>
          </CardContainer>

          <CardContainer size="md" domain="dosimetry">
            <div style={{ color: 'white', padding: '0.5rem', fontSize: '0.8rem' }}>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#ec4899' }}>⚡ Developer Experience</h4>
              <p style={{ margin: 0, fontSize: '0.7rem' }}>
                Simple props-based API replaces complex CSS.
              </p>
            </div>
          </CardContainer>
        </div>
      </DemoSection>

      {/* Code Example */}
      <DemoSection>
        <SectionTitle>Quick Code Example</SectionTitle>
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.6)', 
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '1rem',
          color: '#e2e8f0',
          fontSize: '0.8rem',
          fontFamily: 'monospace'
        }}>
          {`<QuestionContainer 
  size="lg" 
  domain="physics"
  isActive={isAnswered}
>
  {questionContent}
</QuestionContainer>`}
        </div>
      </DemoSection>

      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
        🎨 All 9 container sprites are now working! 🎉
      </div>
    </DemoPage>
  );
} 