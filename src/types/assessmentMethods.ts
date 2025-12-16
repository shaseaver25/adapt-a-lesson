export type AIResistanceLevel = 'low' | 'high' | 'very-high';

export interface MethodOutput {
  id: string;
  name: string;
  time: string;
  aiProof: boolean;
  outputs?: string[];
}

export interface AssessmentCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  aiResistance: AIResistanceLevel;
  options: MethodOutput[];
}

export interface LessonContext {
  title: string;
  subject: string;
  gradeLevel: string;
  objectives: string[];
}

export interface LocalContext {
  schoolName: string;
  city: string;
  state: string;
  details: string;
}

export const ASSESSMENT_METHODS: Record<string, AssessmentCategory> = {
  traditional: {
    id: 'traditional',
    label: 'Written Assessment',
    icon: '📝',
    description: 'Quizzes, tests, and written responses',
    aiResistance: 'low',
    options: [
      { id: 'quiz', name: 'Multiple Choice Quiz', time: '15-30 min', aiProof: false },
      { id: 'short-answer', name: 'Short Answer', time: '20-40 min', aiProof: false },
      { id: 'essay', name: 'Essay Response', time: '45-60 min', aiProof: false },
    ]
  },
  livePerformance: {
    id: 'livePerformance',
    label: 'Live Performance',
    icon: '🎤',
    description: 'Real-time demonstration of understanding',
    aiResistance: 'high',
    options: [
      { 
        id: 'oral-defense', 
        name: 'Oral Defense', 
        time: '5-10 min/student', 
        aiProof: true,
        outputs: ['Question prompts for teacher', 'Rubric', 'Scheduling template'] 
      },
      { 
        id: 'think-aloud', 
        name: 'Think-Aloud Problem Solving', 
        time: '10-15 min', 
        aiProof: true,
        outputs: ['Problem set', 'Observation checklist', 'Recording prompts'] 
      },
      { 
        id: 'socratic', 
        name: 'Socratic Discussion', 
        time: '15-20 min', 
        aiProof: true,
        outputs: ['Discussion questions (tiered by level)', 'Participation rubric', 'Pivot AI integration'] 
      },
      { 
        id: 'teach-back', 
        name: 'Peer Teaching', 
        time: '10-15 min', 
        aiProof: true,
        outputs: ['Mini-lesson template', 'Peer feedback form', 'Teacher rubric'] 
      },
    ]
  },
  processPortfolio: {
    id: 'processPortfolio',
    label: 'Process Portfolio',
    icon: '📂',
    description: 'Evidence of learning journey over time',
    aiResistance: 'high',
    options: [
      { 
        id: 'revision-portfolio', 
        name: 'Revision Portfolio', 
        time: 'Multi-day', 
        aiProof: true,
        outputs: ['Draft checkpoint prompts', 'Reflection questions', 'Growth rubric'] 
      },
      { 
        id: 'learning-journal', 
        name: 'Learning Journal', 
        time: 'Ongoing', 
        aiProof: true,
        outputs: ['Daily entry prompts', 'Journal templates', 'Self-assessment guide'] 
      },
      { 
        id: 'video-walkthrough', 
        name: 'Video Explanation', 
        time: '5-10 min recording', 
        aiProof: true,
        outputs: ['Recording guidelines', 'Explanation rubric', 'Upload instructions'] 
      },
    ]
  },
  communityConnected: {
    id: 'communityConnected',
    label: 'Community Connected',
    icon: '🏘️',
    description: 'Rooted in local context — impossible to outsource',
    aiResistance: 'very-high',
    options: [
      { 
        id: 'photo-documentation', 
        name: 'Photo Documentation', 
        time: '1-2 days', 
        aiProof: true,
        outputs: ['Scavenger hunt list', 'Photo annotation template', 'Presentation rubric'] 
      },
      { 
        id: 'community-interview', 
        name: 'Community Interview', 
        time: '2-3 days', 
        aiProof: true,
        outputs: ['Interview question guide', 'Synthesis template', 'Reflection rubric'] 
      },
      { 
        id: 'local-analysis', 
        name: 'Local News/Event Analysis', 
        time: '30-45 min', 
        aiProof: true,
        outputs: ['Source selection guide', 'Analysis framework', 'Connection rubric'] 
      },
      { 
        id: 'neighborhood-application', 
        name: 'Neighborhood Application', 
        time: '1-2 days', 
        aiProof: true,
        outputs: ['Observation guide', 'Application worksheet', 'Presentation template'] 
      },
    ]
  },
  createAndDefend: {
    id: 'createAndDefend',
    label: 'Create & Defend',
    icon: '🔨',
    description: 'Build something, then explain your choices',
    aiResistance: 'high',
    options: [
      { 
        id: 'physical-creation', 
        name: 'Physical Creation + Defense', 
        time: '2-3 days', 
        aiProof: true,
        outputs: ['Project requirements', 'Materials list', 'Defense question bank'] 
      },
      { 
        id: 'student-generated-quiz', 
        name: 'Student-Generated Assessment', 
        time: '30-45 min', 
        aiProof: true,
        outputs: ['Question creation guide', 'Quality criteria', 'Peer exchange system'] 
      },
      { 
        id: 'teach-younger', 
        name: 'Teach a Younger Grade', 
        time: '45-60 min prep', 
        aiProof: true,
        outputs: ['Lesson plan template', 'Age-appropriate guidelines', 'Impact reflection'] 
      },
    ]
  }
};
