
import React from 'react';
import { Difficulty } from '../types';
import { SparklesIcon } from './Icons';

interface ControlsProps {
  topic: string;
  setTopic: (topic: string) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasResults: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  numQuestions,
  setNumQuestions,
  onGenerate,
  isGenerating,
  hasResults,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Topic Input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Renaissance, Quantum Physics"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            disabled={isGenerating}
          />
        </div>

        {/* Difficulty Select */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            disabled={isGenerating}
          >
            <option value={Difficulty.Easy}>Easy</option>
            <option value={Difficulty.Medium}>Medium</option>
            <option value={Difficulty.Hard}>Hard</option>
          </select>
        </div>

        {/* Number of Questions Input */}
        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
            min="1"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            disabled={isGenerating}
          />
        </div>
      </div>
      
      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !topic.trim()}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <SparklesIcon className="w-5 h-5 mr-2" />
        {isGenerating ? 'Generating...' : hasResults ? 'Regenerate' : 'Generate Q&A'}
      </button>
    </div>
  );
};

export default Controls;
