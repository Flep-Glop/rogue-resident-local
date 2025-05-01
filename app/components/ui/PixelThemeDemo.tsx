'use client';

/**
 * PixelThemeDemo.tsx
 * A demonstration component showcasing the various PixelUI components and styles
 * Can be used for development and testing, or as a reference
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import PixelUI from './PixelUI';
import pixelTheme from '@/app/styles/pixelTheme';
import pixelAnimations from '@/app/styles/pixelAnimations';

const DemoContainer = styled.div`
  padding: ${pixelTheme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  margin-bottom: ${pixelTheme.spacing.xl};
`;

const Row = styled.div`
  display: flex;
  gap: ${pixelTheme.spacing.md};
  margin-bottom: ${pixelTheme.spacing.md};
  flex-wrap: wrap;
`;

// Button with animation on hover
const AnimatedButton = styled(PixelUI.Button)`
  &:hover {
    ${pixelAnimations.animations.pulse('1s')}
  }
`;

// Text with typewriter effect
const TypewriterText = styled(PixelUI.Text)`
  ${pixelAnimations.animations.typewriter('3s')}
  display: inline-block;
`;

// Star with twinkle animation
const TwinkleStar = styled(PixelUI.Star)`
  ${pixelAnimations.animations.twinkle()}
  display: inline-block;
  margin: ${pixelTheme.spacing.xs};
`;

// Modal overlay for dialog demo
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

/**
 * A demonstration component showcasing the pixel UI theme
 */
const PixelThemeDemo: React.FC = () => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [momentum, setMomentum] = useState(2);
  const [insight, setInsight] = useState(65);
  const [starPoints, setStarPoints] = useState(12);
  
  return (
    <DemoContainer>
      <PixelUI.Heading>Pixel UI Theme Demo</PixelUI.Heading>
      <PixelUI.Text>This demonstrates the components and styling from the Pixel UI theme package.</PixelUI.Text>
      
      {/* Typography Section */}
      <Section>
        <PixelUI.Subheading>Typography</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <PixelUI.Heading>Heading Component</PixelUI.Heading>
          <PixelUI.Subheading>Subheading Component</PixelUI.Subheading>
          <PixelUI.Text>Regular Text Component</PixelUI.Text>
          <PixelUI.Text $variant="small">Small Text Variant</PixelUI.Text>
          <TypewriterText>This text has a typewriter effect...</TypewriterText>
          
          <div style={{ marginTop: pixelTheme.spacing.md }}>
            <PixelUI.Text $domainColor={pixelTheme.colors.treatmentPlanning}>Treatment Planning</PixelUI.Text>
            <PixelUI.Text $domainColor={pixelTheme.colors.radiationTherapy}>Radiation Therapy</PixelUI.Text>
            <PixelUI.Text $domainColor={pixelTheme.colors.linacAnatomy}>Linac Anatomy</PixelUI.Text>
            <PixelUI.Text $domainColor={pixelTheme.colors.dosimetry}>Dosimetry</PixelUI.Text>
          </div>
        </PixelUI.Box>
      </Section>
      
      {/* Buttons Section */}
      <Section>
        <PixelUI.Subheading>Buttons</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <Row>
            <PixelUI.Button>Standard Button</PixelUI.Button>
            <PixelUI.Button $primary>Primary Button</PixelUI.Button>
            <PixelUI.Button disabled>Disabled Button</PixelUI.Button>
          </Row>
          
          <Row>
            <PixelUI.Button $domainColor={pixelTheme.colors.treatmentPlanning}>
              Treatment Planning
            </PixelUI.Button>
            <PixelUI.Button $domainColor={pixelTheme.colors.radiationTherapy}>
              Radiation Therapy
            </PixelUI.Button>
            <PixelUI.Button $domainColor={pixelTheme.colors.linacAnatomy}>
              Linac Anatomy
            </PixelUI.Button>
            <PixelUI.Button $domainColor={pixelTheme.colors.dosimetry}>
              Dosimetry
            </PixelUI.Button>
          </Row>
          
          <Row>
            <AnimatedButton>Animated Button</AnimatedButton>
          </Row>
        </PixelUI.Box>
      </Section>
      
      {/* Cards Section */}
      <Section>
        <PixelUI.Subheading>Cards</PixelUI.Subheading>
        <Row>
          <PixelUI.Card style={{ width: '30%' }}>
            <PixelUI.Text $variant="heading">Standard Card</PixelUI.Text>
            <PixelUI.Text>This is a basic card component that can be used for various content.</PixelUI.Text>
          </PixelUI.Card>
          
          <PixelUI.Card $selected style={{ width: '30%' }}>
            <PixelUI.Text $variant="heading">Selected Card</PixelUI.Text>
            <PixelUI.Text>This card has the selected state applied to it.</PixelUI.Text>
          </PixelUI.Card>
          
          <PixelUI.Card style={{ width: '30%', position: 'relative' }} $domainColor={pixelTheme.colors.treatmentPlanning}>
            <PixelUI.Text $variant="heading">Domain Card</PixelUI.Text>
            <PixelUI.Text>This card has a domain color indicator.</PixelUI.Text>
          </PixelUI.Card>
        </Row>
      </Section>
      
      {/* Stars Section */}
      <Section>
        <PixelUI.Subheading>Knowledge Stars</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <Row>
            <div>
              <PixelUI.Text $variant="small">Regular Stars:</PixelUI.Text>
              <div style={{ display: 'flex', marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Star $active $size="sm" />
                <PixelUI.Star $active $size="md" />
                <PixelUI.Star $active $size="lg" />
              </div>
            </div>
            
            <div>
              <PixelUI.Text $variant="small">Inactive Stars:</PixelUI.Text>
              <div style={{ display: 'flex', marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Star $size="sm" />
                <PixelUI.Star $size="md" />
                <PixelUI.Star $size="lg" />
              </div>
            </div>
            
            <div>
              <PixelUI.Text $variant="small">Domain Stars:</PixelUI.Text>
              <div style={{ display: 'flex', marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Star $active $domainColor={pixelTheme.colors.treatmentPlanning} />
                <PixelUI.Star $active $domainColor={pixelTheme.colors.radiationTherapy} />
                <PixelUI.Star $active $domainColor={pixelTheme.colors.linacAnatomy} />
                <PixelUI.Star $active $domainColor={pixelTheme.colors.dosimetry} />
              </div>
            </div>
          </Row>
          
          <Row>
            <div>
              <PixelUI.Text $variant="small">Animated Stars:</PixelUI.Text>
              <div style={{ display: 'flex', marginTop: pixelTheme.spacing.xs }}>
                <TwinkleStar $active $size="sm" />
                <TwinkleStar $active $size="md" $glow />
                <TwinkleStar $active $size="lg" $domainColor={pixelTheme.colors.highlight} $glow />
              </div>
            </div>
          </Row>
        </PixelUI.Box>
      </Section>
      
      {/* Resources Section */}
      <Section>
        <PixelUI.Subheading>Resource Displays</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <Row>
            <div>
              <PixelUI.Text $variant="small">Momentum:</PixelUI.Text>
              <PixelUI.MomentumDisplay value={momentum} />
              <div style={{ marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Button onClick={() => setMomentum(prev => Math.min(3, prev + 1))}>+</PixelUI.Button>
                <PixelUI.Button onClick={() => setMomentum(prev => Math.max(0, prev - 1))}>-</PixelUI.Button>
              </div>
            </div>
            
            <div>
              <PixelUI.Text $variant="small">Insight:</PixelUI.Text>
              <PixelUI.InsightDisplay value={insight} />
              <div style={{ marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Button onClick={() => setInsight(prev => Math.min(100, prev + 10))}>+10</PixelUI.Button>
                <PixelUI.Button onClick={() => setInsight(prev => Math.max(0, prev - 10))}>-10</PixelUI.Button>
              </div>
            </div>
            
            <div>
              <PixelUI.Text $variant="small">Star Points:</PixelUI.Text>
              <PixelUI.StarPointsDisplay value={starPoints} />
              <div style={{ marginTop: pixelTheme.spacing.xs }}>
                <PixelUI.Button onClick={() => setStarPoints(prev => prev + 1)}>+1</PixelUI.Button>
                <PixelUI.Button onClick={() => setStarPoints(prev => Math.max(0, prev - 1))}>-1</PixelUI.Button>
              </div>
            </div>
          </Row>
        </PixelUI.Box>
      </Section>
      
      {/* Progress Bars Section */}
      <Section>
        <PixelUI.Subheading>Progress Bars</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <div style={{ marginBottom: pixelTheme.spacing.sm }}>
            <PixelUI.Text $variant="small">Standard Progress (65%):</PixelUI.Text>
            <PixelUI.ProgressBar value={65} />
          </div>
          
          <div style={{ marginBottom: pixelTheme.spacing.sm }}>
            <PixelUI.Text $variant="small">Treatment Planning Progress (80%):</PixelUI.Text>
            <PixelUI.ProgressBar value={80} color={pixelTheme.colors.treatmentPlanning} />
          </div>
          
          <div style={{ marginBottom: pixelTheme.spacing.sm }}>
            <PixelUI.Text $variant="small">Radiation Therapy Progress (45%):</PixelUI.Text>
            <PixelUI.ProgressBar value={45} color={pixelTheme.colors.radiationTherapy} />
          </div>
          
          <div style={{ marginBottom: pixelTheme.spacing.sm }}>
            <PixelUI.Text $variant="small">Linac Anatomy Progress (30%):</PixelUI.Text>
            <PixelUI.ProgressBar value={30} color={pixelTheme.colors.linacAnatomy} />
          </div>
          
          <div>
            <PixelUI.Text $variant="small">Dosimetry Progress (60%):</PixelUI.Text>
            <PixelUI.ProgressBar value={60} color={pixelTheme.colors.dosimetry} />
          </div>
        </PixelUI.Box>
      </Section>
      
      {/* Tooltip Section */}
      <Section>
        <PixelUI.Subheading>Tooltips</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <PixelUI.Button 
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              Hover for Tooltip
            </PixelUI.Button>
            
            <PixelUI.Tooltip $visible={tooltipVisible} $position="top">
              <PixelUI.TooltipTitle>Tooltip Title</PixelUI.TooltipTitle>
              <PixelUI.TooltipContent>
                This is a tooltip that appears on hover. It can have a title and content.
              </PixelUI.TooltipContent>
            </PixelUI.Tooltip>
          </div>
        </PixelUI.Box>
      </Section>
      
      {/* Dialog Section */}
      <Section>
        <PixelUI.Subheading>Dialog Boxes</PixelUI.Subheading>
        <PixelUI.Box $pixelBorder>
          <PixelUI.Button onClick={() => setDialogVisible(true)}>
            Show Dialog
          </PixelUI.Button>
          
          {dialogVisible && (
            <ModalOverlay>
              <PixelUI.Dialog title="Dialog Example">
                <PixelUI.Text>
                  This is an example dialog box. It can contain any content and be used
                  for interactions that require focused attention.
                </PixelUI.Text>
                <div style={{ marginTop: pixelTheme.spacing.lg }}>
                  <PixelUI.Button onClick={() => setDialogVisible(false)}>
                    Close Dialog
                  </PixelUI.Button>
                </div>
              </PixelUI.Dialog>
            </ModalOverlay>
          )}
        </PixelUI.Box>
      </Section>
    </DemoContainer>
  );
};

export default PixelThemeDemo; 