
export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface QAItem {
  question: string;
  answer: string;
}

export interface Source {
  uri: string;
  title: string;
  summary?: string;
}
