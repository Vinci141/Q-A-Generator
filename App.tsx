
import React, { useState, useCallback } from 'react';
import { Difficulty, QAItem, Source } from './types';
import { generateQA } from './services/geminiService';
import Controls from './components/Controls';
import QAList from './components/QAList';
import Loader from './components/Loader';
import { DownloadIcon } from './components/Icons';

// Access jspdf and html2canvas from the window object
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
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
    const qaContainer = document.getElementById('qa-container');
    if (qaContainer) {
      const { jsPDF } = window.jspdf;
      window.html2canvas(qaContainer, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth - 20;
        const height = width / ratio;

        let position = 10;
        
        if (height > pdfHeight - 20) {
            // If content is too tall, it would need multi-page logic
            // For this app, we'll fit it to one page, which may reduce quality for long lists.
            const imgHeight = pdfHeight - 20;
            const imgWidth = imgHeight * ratio;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        } else {
            pdf.addImage(imgData, 'PNG', 10, position, width, height);
        }
        
        const filename = `QA_${topic.replace(/\s+/g, '_')}_${difficulty}.pdf`;
        pdf.save(filename);
      });
    }
  }, [topic, difficulty]);


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
