import React, { useState, useEffect } from 'react';
import { X, GraduationCap, HelpCircle, Layers, Volume2, Download, CheckCircle2, XCircle, RotateCcw, Loader2, Play } from 'lucide-react';
import { fetchApi } from '../../lib/api-client';
import type { IStudySet, IQuizQuestion, IFlashcard } from '@pdf-chatbot/shared';

interface StudyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentTitle: string;
}

export const StudyHubModal: React.FC<StudyHubModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards' | 'audio'>('quiz');
  const [loading, setLoading] = useState<boolean>(false);
  const [studySet, setStudySet] = useState<IStudySet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      setQuizAnswers({});
      setSubmittedQuiz(false);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setAudioUrl(null);

      fetchApi<IStudySet>(`/documents/${documentId}/study-set`)
        .then((res) => {
          if (res.success && res.data) {
            setStudySet(res.data);
          } else {
            setError(res.message || 'Failed to load study set');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch study set');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen || !documentId) return null;

  const handleGenerateAudio = () => {
    setGeneratingAudio(true);
    fetchApi<{ audioUrl: string }>(`/documents/${documentId}/audio-overview`, { method: 'POST' })
      .then((res) => {
        if (res.success && res.data) {
          setAudioUrl(res.data.audioUrl);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setGeneratingAudio(false));
  };

  const exportAnkiCsv = () => {
    if (!studySet?.flashcards?.length) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + studySet.flashcards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Anki_Flashcards_${documentTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Study & Research Hub</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'quiz'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Practice Quiz
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'flashcards'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Flashcard Decks
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 py-3 border-b-2 transition-all ${
              activeTab === 'audio'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Audio Podcast Overview
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40 text-slate-200">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span>Generating personalized quiz & flashcards from document...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-300 text-sm text-center p-6">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-base">Unable to connect to AI Study Service</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                {error.includes('fetch') ? 'Backend or AI microservice is currently starting up or offline. Make sure backend service (Port 5000) and AI service (Port 8001) are running.' : error}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchApi<IStudySet>(`/documents/${documentId}/study-set`)
                    .then((res) => {
                      if (res.success && res.data) setStudySet(res.data);
                      else setError(res.message || 'Failed to load study set');
                    })
                    .catch((err) => setError(err.message || 'Failed to fetch study set'))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                Retry Generating Study Set
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {studySet?.quizzes?.map((q, qIdx) => {
                    const selectedOpt = quizAnswers[q.id];
                    const isCorrect = selectedOpt === q.correctAnswerIndex;

                    return (
                      <div
                        key={q.id || qIdx}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-100">
                            {qIdx + 1}. {q.question}
                          </h4>
                          {submittedQuiz && (
                            isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )
                          )}
                        </div>

                        <div className="space-y-2">
                          {q.options?.map((opt, optIdx) => {
                            let btnStyle = "bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300";
                            if (selectedOpt === optIdx) {
                              btnStyle = "bg-purple-950/60 border-purple-500 text-purple-200 font-semibold";
                            }
                            if (submittedQuiz) {
                              if (optIdx === q.correctAnswerIndex) {
                                btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold";
                              } else if (selectedOpt === optIdx && !isCorrect) {
                                btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200 font-semibold";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => !submittedQuiz && setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center gap-2 ${btnStyle}`}
                                disabled={submittedQuiz}
                              >
                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-mono">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {submittedQuiz && (
                          <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-lg text-xs text-purple-300">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-2">
                    {submittedQuiz ? (
                      <button
                        onClick={() => { setSubmittedQuiz(false); setQuizAnswers({}); }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => setSubmittedQuiz(true)}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                      >
                        Submit Answers
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="h-full flex flex-col items-center justify-between py-4 space-y-6">
                  <div className="flex items-center justify-between w-full text-xs text-slate-400">
                    <span>Active Recall Flashcards</span>
                    <button
                      onClick={exportAnkiCsv}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Anki CSV
                    </button>
                  </div>

                  {studySet?.flashcards?.length ? (
                    <div className="w-full max-w-md space-y-4">
                      {/* Flip Card Container */}
                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="w-full h-64 bg-gradient-to-tr from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                          {isFlipped ? "Answer (Back)" : "Prompt (Front - Click to Flip)"}
                        </span>
                        <p className="text-base font-medium text-white leading-relaxed">
                          {isFlipped
                            ? studySet.flashcards[currentCardIndex]?.back
                            : studySet.flashcards[currentCardIndex]?.front}
                        </p>
                      </div>

                      {/* Card Controls */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <button
                          onClick={() => {
                            setIsFlipped(false);
                            setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          }}
                          disabled={currentCardIndex === 0}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <span>{currentCardIndex + 1} / {studySet.flashcards.length}</span>

                        <button
                          onClick={() => {
                            setIsFlipped(false);
                            setCurrentCardIndex(prev => Math.min(studySet.flashcards.length - 1, prev + 1));
                          }}
                          disabled={currentCardIndex === studySet.flashcards.length - 1}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">No flashcards available.</div>
                  )}
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                  <div className={`p-5 rounded-full ${audioUrl ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-bounce' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'}`}>
                    <Volume2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">Audio Podcast Overview</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      {audioUrl
                        ? 'Audio podcast generated successfully! Listen below:'
                        : 'Synthesize document key findings into a clear, AI-narrated audio summary.'}
                    </p>
                  </div>

                  {audioUrl ? (
                    <div className="w-full max-w-md p-5 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-xl space-y-4">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        AI Voice Synthesis Ready
                      </div>
                      <audio controls autoPlay className="w-full rounded-lg" src={audioUrl}>
                        Your browser does not support audio playback.
                      </audio>
                      <button
                        onClick={handleGenerateAudio}
                        disabled={generatingAudio}
                        className="text-xs text-slate-400 hover:text-white underline transition-colors"
                      >
                        Regenerate Audio
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateAudio}
                      disabled={generatingAudio}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {generatingAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Audio (gTTS)...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" /> Generate Audio Overview
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
