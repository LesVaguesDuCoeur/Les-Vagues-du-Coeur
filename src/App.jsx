import React, { useState } from 'react';
import { CVProvider, useCV } from './store/cvStore';
import EditorLayout from './components/editor/EditorLayout';
import CVPreview from './components/preview/CVPreview';
import { generateWord } from './utils/wordGenerator';
import { CVDocument } from './utils/pdfGenerator';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Save, FileText, FileDown, Eye, Edit } from 'lucide-react';
import clsx from 'clsx';

const Dashboard = () => {
  const { state, saveToCloud } = useCV();
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'preview'
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'error'

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      await saveToCloud();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#1A365D] text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText size={28} />
            <h1 className="text-2xl font-bold">Générateur de CV</h1>
          </div>

          <div className="flex gap-2 items-center">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {saveStatus === 'saved' && <span className="text-green-400 text-sm">Sauvegardé!</span>}
            {saveStatus === 'error' && <span className="text-red-400 text-sm">Erreur!</span>}

            {/* Export Word */}
            <button
              onClick={() => generateWord(state)}
              className="flex items-center px-4 py-2 bg-white text-[#1A365D] hover:bg-gray-100 rounded-lg transition"
            >
              <FileDown size={18} className="mr-2" />
              Word
            </button>

            {/* Export PDF */}
            <PDFDownloadLink
              document={<CVDocument data={state} />}
              fileName={`CV_${state.personalInfo.lastName}_${state.personalInfo.firstName}.pdf`}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              {({ loading }) => (
                <>
                  <FileDown size={18} className="mr-2" />
                  {loading ? 'Génération...' : 'PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b bg-white sticky top-[72px] z-40">
        <button
          className={clsx("flex-1 py-3 flex justify-center items-center gap-2 font-medium", activeTab === 'editor' ? "text-[#1A365D] border-b-2 border-[#1A365D]" : "text-gray-500")}
          onClick={() => setActiveTab('editor')}
        >
          <Edit size={18} /> Éditer
        </button>
        <button
          className={clsx("flex-1 py-3 flex justify-center items-center gap-2 font-medium", activeTab === 'preview' ? "text-[#1A365D] border-b-2 border-[#1A365D]" : "text-gray-500")}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={18} /> Aperçu
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 grid md:grid-cols-2 gap-8 items-start">
        {/* Left: Editor */}
        <div className={clsx("w-full md:block", activeTab === 'editor' ? "block" : "hidden")}>
           <EditorLayout />
        </div>

        {/* Right: Preview */}
        <div className={clsx("w-full md:block sticky top-24", activeTab === 'preview' ? "block" : "hidden")}>
           <div className="bg-gray-200 p-4 rounded-lg border shadow-inner overflow-auto max-h-[calc(100vh-120px)]">
              <div className="transform origin-top scale-[0.5] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 transition-transform duration-300 mx-auto bg-white shadow-xl min-h-[297mm] w-[210mm] flex justify-center">
                 {/* Scale Wrapper to fit screen */}
                 <div className="w-full">
                    <CVPreview />
                 </div>
              </div>
           </div>
           <div className="text-center text-gray-500 text-sm mt-2">
              Aperçu A4
           </div>
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <CVProvider>
    <Dashboard />
  </CVProvider>
);

export default App;
