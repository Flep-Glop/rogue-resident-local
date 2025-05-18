import { MentorId, MentorVoiceContext, MentorVoiceProfile } from '../../types/mentorVoice';
import { mentorProfiles } from '../../data/mentors/mentorVoiceProfiles';
import { Domain, Difficulty, QuestionType } from '../../types/questions';

/**
 * Service for applying mentor voice patterns to question templates
 */
export class MentorVoiceService {
  private mentorProfiles: Record<MentorId, MentorVoiceProfile>;
  
  constructor(profiles = mentorProfiles) {
    this.mentorProfiles = profiles;
  }
  
  /**
   * Get a random item from an array
   */
  private getRandomItem<T>(items: T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Cannot get random item from empty array");
    }
    return items[Math.floor(Math.random() * items.length)];
  }
  
  /**
   * Get a mentor profile by ID
   */
  public getMentorProfile(mentorId: MentorId): MentorVoiceProfile {
    const profile = this.mentorProfiles[mentorId];
    if (!profile) {
      throw new Error(`Mentor profile not found for ID: ${mentorId}`);
    }
    return profile;
  }
  
  /**
   * Get appropriate intro for a mentor based on context
   */
  public getMentorIntro(mentorId: MentorId, context: MentorVoiceContext): string {
    const profile = this.getMentorProfile(mentorId);
    
    // If it's a boast question, use boast response
    if (context.isBoast) {
      return this.getRandomItem(profile.patterns.boastResponses);
    }
    
    // For other question types, use appropriate intro based on context
    return this.getRandomItem(profile.patterns.intros);
  }
  
  /**
   * Get appropriate inquiry phrase for a mentor
   */
  public getMentorInquiry(mentorId: MentorId, context: MentorVoiceContext): string {
    const profile = this.getMentorProfile(mentorId);
    
    if (context.isBoast) {
      return this.getRandomItem(profile.patterns.challenges);
    }
    
    return this.getRandomItem(profile.patterns.inquiries);
  }
  
  /**
   * Get domain-specific phrases for a mentor
   */
  public getDomainPhrase(mentorId: MentorId, domain: Domain): string | null {
    const profile = this.getMentorProfile(mentorId);
    const domainPhrases = profile.patterns.domainPhrases[domain];
    
    if (!domainPhrases || domainPhrases.length === 0) {
      return null;
    }
    
    return this.getRandomItem(domainPhrases);
  }
  
  /**
   * Get difficulty-specific phrases for a mentor
   */
  public getDifficultyPhrase(mentorId: MentorId, difficulty: Difficulty): string | null {
    const profile = this.getMentorProfile(mentorId);
    const difficultyPhrases = profile.patterns.difficultyPhrases[difficulty];
    
    if (!difficultyPhrases || difficultyPhrases.length === 0) {
      return null;
    }
    
    return this.getRandomItem(difficultyPhrases);
  }
  
  /**
   * Get feedback phrase for correct answer
   */
  public getCorrectFeedback(mentorId: MentorId): string {
    const profile = this.getMentorProfile(mentorId);
    return this.getRandomItem(profile.patterns.correctFeedback);
  }
  
  /**
   * Get feedback phrase for incorrect answer
   */
  public getIncorrectFeedback(mentorId: MentorId): string {
    const profile = this.getMentorProfile(mentorId);
    return this.getRandomItem(profile.patterns.incorrectFeedback);
  }
  
  /**
   * Get transition phrase
   */
  public getTransition(mentorId: MentorId): string {
    const profile = this.getMentorProfile(mentorId);
    return this.getRandomItem(profile.patterns.transitions);
  }
  
  /**
   * Get emphasis phrase
   */
  public getEmphasis(mentorId: MentorId): string {
    const profile = this.getMentorProfile(mentorId);
    return this.getRandomItem(profile.patterns.emphasis);
  }
  
  /**
   * Get conclusion phrase
   */
  public getConclusion(mentorId: MentorId): string {
    const profile = this.getMentorProfile(mentorId);
    return this.getRandomItem(profile.patterns.conclusions);
  }
  
  /**
   * Apply mentor voice to a question text template
   * Replaces placeholders like {mentorIntro}, {mentorInquiry}, etc.
   */
  public applyMentorVoice(
    template: string, 
    mentorId: MentorId, 
    context: MentorVoiceContext
  ): string {
    if (!template) {
      return '';
    }
    
    let result = template;
    
    // Replace mentor-specific placeholders
    result = result.replace('{mentorName}', this.getMentorProfile(mentorId).name);
    result = result.replace('{mentorIntro}', this.getMentorIntro(mentorId, context));
    result = result.replace('{mentorInquiry}', this.getMentorInquiry(mentorId, context));
    result = result.replace('{mentorTransition}', this.getTransition(mentorId));
    result = result.replace('{mentorEmphasis}', this.getEmphasis(mentorId));
    result = result.replace('{mentorConclusion}', this.getConclusion(mentorId));
    
    // Add domain and difficulty specific phrases if they exist in the template
    const domainPhrase = this.getDomainPhrase(mentorId, context.domain);
    if (domainPhrase) {
      result = result.replace('{domainPhrase}', domainPhrase);
    }
    
    const difficultyPhrase = this.getDifficultyPhrase(mentorId, context.difficulty);
    if (difficultyPhrase) {
      result = result.replace('{difficultyPhrase}', difficultyPhrase);
    }
    
    return result;
  }
  
  /**
   * Apply mentor voice to feedback template
   */
  public applyMentorFeedback(
    template: string,
    mentorId: MentorId,
    isCorrect: boolean
  ): string {
    if (!template) {
      return '';
    }
    
    let result = template;
    
    // Replace feedback placeholders
    result = result.replace(
      '{mentorFeedback}', 
      isCorrect ? this.getCorrectFeedback(mentorId) : this.getIncorrectFeedback(mentorId)
    );
    
    // Replace other mentor-specific placeholders
    result = result.replace('{mentorName}', this.getMentorProfile(mentorId).name);
    result = result.replace('{mentorTransition}', this.getTransition(mentorId));
    result = result.replace('{mentorEmphasis}', this.getEmphasis(mentorId));
    result = result.replace('{mentorConclusion}', this.getConclusion(mentorId));
    
    return result;
  }
  
  /**
   * Find the best mentor for a question based on domain and difficulty
   */
  public findBestMentor(domain: Domain, difficulty: Difficulty): MentorId {
    // Score each mentor based on their specialty and patterns available
    const scores: Record<MentorId, number> = {
      'Kapoor': 0,
      'Garcia': 0,
      'Jesse': 0,
      'Quinn': 0
    };
    
    // Score based on specialties (domains)
    Object.entries(this.mentorProfiles).forEach(([id, profile]) => {
      const mentorId = id as MentorId;
      
      // Primary match for domain specialty
      if (profile.specialties.includes(domain)) {
        scores[mentorId] += 3;
      }
      
      // Check for domain phrases
      if (profile.patterns.domainPhrases[domain]?.length > 0) {
        scores[mentorId] += 2;
      }
      
      // Check for difficulty phrases
      if (profile.patterns.difficultyPhrases[difficulty]?.length > 0) {
        scores[mentorId] += 1;
      }
    });
    
    // Find mentor with highest score
    let bestMentor: MentorId = 'Kapoor'; // Default
    let highestScore = 0;
    
    Object.entries(scores).forEach(([id, score]) => {
      if (score > highestScore) {
        highestScore = score;
        bestMentor = id as MentorId;
      }
    });
    
    return bestMentor;
  }
} 