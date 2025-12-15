import { AIVulnerabilityAnalysis } from './vulnerabilityAnalysis';

export interface RubricInput {
  assessmentDescription: string;
  learningObjectives: string[];
  numCriteria: number;
  vulnerabilityAnalysis?: AIVulnerabilityAnalysis;
}
