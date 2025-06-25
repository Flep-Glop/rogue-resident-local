import { KnowledgeDomain, MentorId } from '@/app/types';
import { useJournalStore } from '@/app/store/journalStore';

// Initial mentor journal entries to pre-populate the journal
const initialMentorEntries = [
  {
    mentorId: MentorId.GARCIA,
    title: 'First Meeting with Dr. Garcia',
    content: 
      `Dr. Garcia welcomed me to the radiation oncology department today. She's the lead radiation oncologist and has been working in the field for over 15 years.\n\n` +
      `Key takeaways from our first meeting:\n` +
      `- She emphasized the importance of clear communication with patients\n` +
      `- She suggested focusing on fundamentals before diving into complex techniques\n` +
      `- She mentioned that she'll be supervising my work on head and neck cases`
  },
  {
    mentorId: MentorId.KAPOOR,
    title: 'Introduction to Dr. Kapoor',
    content: 
      `Had my first session with Dr. Kapoor, the chief medical physicist. He has a reputation for being demanding but excellent at teaching the core principles.\n\n` +
      `He asked about my background and seemed pleased with my knowledge of basic physics. He outlined what he expects from residents:\n` +
      `- Thorough preparation before each QA session\n` +
      `- Proper documentation of all procedures\n` +
      `- Questions are welcome, but he expects me to have done my research first`
  },
  {
    mentorId: MentorId.JESSE,
    title: 'Equipment Training with Jesse',
    content: 
      `Jesse is the lead radiation therapist and has been incredibly helpful on my first day. He's been at the hospital for over a decade and knows every piece of equipment inside and out.\n\n` +
      `He gave me a tour of the LINAC rooms and showed me the daily startup procedures for the linear accelerators. Jesse has a very hands-on teaching style, which I appreciate.\n\n` +
      `He mentioned that he's always available for questions about equipment operation and patient positioning.`
  },
  {
    mentorId: MentorId.QUINN,
    title: 'Meeting Dr. Quinn',
    content: 
      `Dr. Quinn is a radiation oncologist specializing in pediatric cases. Our first meeting was brief but informative.\n\n` +
      `She explained that pediatric treatments require special considerations:\n` +
      `- Growth and development impacts\n` +
      `- Long-term effects of radiation\n` +
      `- Age-appropriate communication strategies\n\n` +
      `She invited me to observe a pediatric case review next week, which should be an excellent learning opportunity.`
  }
];

// Function to initialize the journal with starter entries
export const initializeJournal = () => {
  const journalStore = useJournalStore.getState();
  
  if (!journalStore) return;
  
  // Add mentor entries
  initialMentorEntries.forEach(entry => {
    const { mentorId, title, content } = entry;
    journalStore.addMentorEntry(mentorId, title, content);
  });
  
  console.log('Journal initialized with starter entries');
}; 