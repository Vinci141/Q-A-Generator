import React, { useState, useCallback } from 'react';
import { Difficulty, QAItem, Source } from './types';
import { generateQA } from './services/geminiService';
import Controls from './components/Controls';
import QAList from './components/QAList';
import Loader from './components/Loader';
import { DownloadIcon } from './components/Icons';

// Access jspdf from the window object
declare global {
    interface Window {
        jspdf: any;
    }
}

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('The American Revolution');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setQaList([]);
    setSources([]);

    try {
      const result = await generateQA(topic, difficulty, numQuestions);
      setQaList(result.qaList);
      setSources(result.sources);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, difficulty, numQuestions]);

  const handleDownloadPDF = useCallback(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - 2 * margin;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // --- Document Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`Q&A on: ${topic}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`, pageWidth / 2, y, { align: 'center' });
    y += 15;


    // --- Q&A Section ---
    qaList.forEach((item, index) => {
      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      const questionText = `${index + 1}. ${item.question}`;
      const questionLines = doc.splitTextToSize(questionText, usableWidth);
      checkPageBreak(questionLines.length * 6); // Approx height for question
      doc.text(questionLines, margin, y);
      y += questionLines.length * 6;

      // Answer
      y += 4; // Space between Q and A
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const answerLines = doc.splitTextToSize(item.answer, usableWidth);
      checkPageBreak(answerLines.length * 5 + 10); // Approx height for answer + bottom margin
      doc.text(answerLines, margin, y);
      y += answerLines.length * 5 + 10;
    });

    // --- Sources Section ---
    if (sources.length > 0) {
      checkPageBreak(20); // Height for header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Fact-Checked Sources', margin, y);
      y += 10;

      sources.forEach((source) => {
        const sourceTitle = source.title || 'Untitled Source';
        const titleLines = doc.splitTextToSize(sourceTitle, usableWidth);
        // Estimate height for title, URL, and spacing
        const neededHeight = (titleLines.length * 4) + 8;
        checkPageBreak(neededHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(titleLines, margin, y);
        y += titleLines.length * 4;

        doc.setTextColor(40, 58, 203); // Set color to blue for link
        doc.textWithLink(source.uri, margin, y, { url: source.uri });
        doc.setTextColor(0, 0, 0); // Reset text color to black
        y += 8;
      });
    }
    
    const filename = `QA_${topic.replace(/\s+/g, '_')}_${difficulty}.pdf`;
    doc.save(filename);
  }, [topic, difficulty, qaList, sources]);


  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Fact-Checked Q&A Generator</h1>
          <p className="mt-2 text-lg text-gray-600">
            Generate verified questions and answers on any topic, powered by AI.
          </p>
        </header>

        <main>
          {/* Controls */}
          <Controls
            topic={topic}
            setTopic={setTopic}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            numQuestions={numQuestions}
            setNumQuestions={setNumQuestions}
            onGenerate={handleGenerate}
            isGenerating={isLoading}
            hasResults={qaList.length > 0}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Results Section */}
          <div className="mt-6">
            {isLoading ? (
              <Loader />
            ) : qaList.length > 0 ? (
                <>
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download as PDF
                    </button>
                </div>
                <QAList qaList={qaList} sources={sources} />
              </>
            ) : (
                <div className="text-center py-12 px-6 bg-white rounded-xl shadow-md mt-8">
                    <h3 className="text-xl font-medium text-gray-700">Ready to start?</h3>
                    <p className="mt-2 text-gray-500">
                        Enter a topic, choose your difficulty, and click "Generate Q&A" to begin.
                    </p>
                </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Google Gemini. Please verify important information.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
