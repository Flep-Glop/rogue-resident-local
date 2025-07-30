'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacing, typography, mixins } from '@/app/styles/pixelTheme';

// Test container with the FIXED 9-slice implementation
const Fixed9SliceContainer = styled.div`
  position: relative;
  ${mixins.pixelPerfect}
  
  /* FIXED: Removed 'fill' keyword from border-image */
  border-image: url('/images/ui/containers/question-9slice.png') 20 40 20 40;
  border-width: 20px 40px 20px 40px;
  border-style: solid;
  
  /* Natural expansion for typewriter effect */
  min-height: 60px;
  width: 100%;
  
  /* Pixel art rendering */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  
  /* Ensure content area is visible */
  background: transparent;
`;

// Alternative approach: Separate background layer
const Alternative9SliceContainer = styled.div`
  position: relative;
  ${mixins.pixelPerfect}
  
  /* Use border-image only for borders, not fill */
  border-image: url('/images/ui/containers/question-9slice.png') 20 40 20 40;
  border-width: 20px 40px 20px 40px;
  border-style: solid;
  
  min-height: 60px;
  width: 100%;
  
  /* Pixel art rendering */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  
  /* Add background using ::before if needed */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(23, 30, 45, 0.9); /* Question background color */
    z-index: -1;
    border-radius: 4px;
  }
`;

// Content wrapper with proper z-index
const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  padding: ${spacing.md};
  display: flex;
  flex-direction: column;
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
`;

// Test components
const TestQuestion = styled.div`
  font-size: ${typography.fontSize.lg};
  line-height: ${typography.lineHeight.tight};
  margin-bottom: ${spacing.md};
  color: ${colors.text};
`;

const TestOption = styled.button`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid #3b82f6;
  padding: ${spacing.sm};
  margin-bottom: ${spacing.xs};
  color: ${colors.text};
  font-family: ${typography.fontFamily.pixel};
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: rgba(59, 130, 246, 0.4);
  }
`;

const PageContainer = styled.div`
  background: #0f172a;
  min-height: 100vh;
  padding: 2rem;
  color: white;
`;

const TestSection = styled.div`
  margin-bottom: 3rem;
  max-width: 600px;
`;

const SectionTitle = styled.h2`
  color: #94a3b8;
  margin-bottom: 1rem;
  font-family: ${typography.fontFamily.pixel};
`;

const DebugInfo = styled.div`
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #94a3b8;
`;

export default function NineSliceDebugPage() {
  const [testText, setTestText] = useState("What is the primary interaction of photons with matter in the diagnostic energy range?");
  
  return (
    <PageContainer>
      <h1>9-Slice Debug Test</h1>
      
      <DebugInfo>
        <strong>Testing 9-slice border-image without 'fill' keyword</strong><br/>
        Border-image: question-9slice.png 20 40 20 40 (no fill)<br/>
        Border-width: 20px 40px 20px 40px<br/>
        Content z-index: 2
      </DebugInfo>
      
      <TestSection>
        <SectionTitle>❌ Original (with 'fill' - text invisible)</SectionTitle>
        <div style={{
          borderImage: 'url(/images/ui/containers/question-9slice.png) 20 40 20 40 fill',
          borderWidth: '20px 40px 20px 40px',
          borderStyle: 'solid',
          minHeight: '60px',
          padding: '1rem'
        }}>
          <div style={{ position: 'relative', zIndex: 2, color: 'white' }}>
            {testText}
          </div>
        </div>
      </TestSection>

      <TestSection>
        <SectionTitle>✅ Fixed (no 'fill' - text visible)</SectionTitle>
        <Fixed9SliceContainer>
          <ContentWrapper>
            <TestQuestion>{testText}</TestQuestion>
            <TestOption>A) Photoelectric effect</TestOption>
            <TestOption>B) Compton scattering</TestOption>
            <TestOption>C) Pair production</TestOption>
            <TestOption>D) Coherent scattering</TestOption>
          </ContentWrapper>
        </Fixed9SliceContainer>
      </TestSection>

      <TestSection>
        <SectionTitle>🎨 Alternative (with background layer)</SectionTitle>
        <Alternative9SliceContainer>
          <ContentWrapper>
            <TestQuestion>{testText}</TestQuestion>
            <TestOption>A) Photoelectric effect</TestOption>
            <TestOption>B) Compton scattering</TestOption>
            <TestOption>C) Pair production</TestOption>
            <TestOption>D) Coherent scattering</TestOption>
          </ContentWrapper>
        </Alternative9SliceContainer>
      </TestSection>
      
      <TestSection>
        <SectionTitle>🔧 Dynamic Text Test</SectionTitle>
        <textarea 
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
          rows={3}
        />
        <Fixed9SliceContainer>
          <ContentWrapper>
            <TestQuestion>{testText}</TestQuestion>
          </ContentWrapper>
        </Fixed9SliceContainer>
      </TestSection>
    </PageContainer>
  );
} 