import { AIVulnerabilityAnalysis } from './vulnerabilityAnalysis';

export interface AIProofSettings {
  enableAIProofAnalysis: boolean;
  requireProcessDocumentation: boolean;
  includeLiveVerification: boolean;
  localSpecificityRequired: boolean;
  generateTeacherVerificationGuide: boolean;
}

export interface VerificationCheckpoints {
  processLog: boolean;
  primaryResearchEvidence: boolean;
  draftHistory: boolean;
  photoDocumentation: boolean;
  liveQA: boolean;
  peerVerification: boolean;
}

export interface RubricExportOptions {
  format: 'docx' | 'markdown' | 'pdf';
  includeComponents: {
    studentRubric: boolean;
    teacherRubric: boolean;
    verificationChecklist: boolean;
    processDocumentationTemplate: boolean;
    qaQuestionBank: boolean;
  };
}

export interface RubricInput {
  assessmentDescription: string;
  learningObjectives: string[];
  numCriteria: number;
  gradeLevel?: string;
  vulnerabilityAnalysis?: AIVulnerabilityAnalysis;
  aiProofSettings?: AIProofSettings;
  verificationCheckpoints?: VerificationCheckpoints;
}
