
import React, { useState } from 'react';
import { QAItem, Source } from '../types';

interface QAListProps {
  qaList: QAItem[];
  sources: Source[];
}

const QAAccordionItem: React.FC<{ item: QAItem; index: number }> = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none"
      >
        <span className="font-semibold text-gray-800">{index + 1}. {item.question}</span>
        <svg
          className={`w-6 h-6 transform transition-transform text-primary ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
};


const QAList: React.FC<QAListProps> = ({ qaList, sources }) => {
  if (qaList.length === 0) {
    return null;
  }

  return (
    <div id="qa-container" className="bg-white p-6 rounded-xl shadow-md mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generated Q&A</h2>
      <div className="space-y-4">
        {qaList.map((item, index) => (
          <QAAccordionItem key={index} item={item} index={index} />
        ))}
      </div>

      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Fact-Checked Sources</h3>
            <ul className="space-y-2">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">&#10003;</span>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline hover:text-blue-800 break-all">
                            {source.title || source.uri}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default QAList;
