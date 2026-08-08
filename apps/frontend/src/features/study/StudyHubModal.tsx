import React, { useState, useEffect } from 'react';
import { X, GraduationCap, HelpCircle, Layers, Volume2, Download, CheckCircle2, XCircle, RotateCcw, Loader2, Play, Pause, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../lib/api-client';
import type { IStudySet } from '@pdf-chatbot/shared';

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
  const [audioText, setAudioText] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState<boolean>(false);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      setQuizAnswers({});
      setSubmittedQuiz(false);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setAudioUrl(null);
      setAudioText(null);
      setAudioError(false);

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingTts(false);

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

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, documentId]);

  if (!isOpen || !documentId) return null;

  const handleGenerateAudio = () => {
    setGeneratingAudio(true);
    setAudioError(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTts(false);

    fetchApi<{ audioUrl: string; text?: string }>(`/documents/${documentId}/audio-overview`, { method: 'POST' })
      .then((res) => {
        if (res.success && res.data) {
          const rawUrl = res.data.audioUrl;
          const formattedUrl = rawUrl.startsWith('http')
            ? rawUrl
            : `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
          setAudioUrl(formattedUrl);
          if (res.data.text) {
            setAudioText(res.data.text);
          }
        } else {
          setAudioError(true);
        }
      })
      .catch((err) => {
        console.error('Audio overview error:', err);
        setAudioError(true);
      })
      .finally(() => setGeneratingAudio(false));
  };

  const handleToggleTts = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
    } else {
      const textToRead = audioText || `${documentTitle} summary overview. Comprehensive study guidelines and topics analyzed by AI.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);
      setIsPlayingTts(true);
      window.speechSynthesis.speak(utterance);
    }
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
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            let btnStyle = "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800";
                            if (selectedOpt === optIdx) {
                              btnStyle = "border-purple-500 bg-purple-500/20 text-purple-300 font-medium";
                            }

                            if (submittedQuiz) {
                              if (optIdx === q.correctAnswerIndex) {
                                btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold";
                              } else if (selectedOpt === optIdx && !isCorrect) {
                                btnStyle = "border-rose-500 bg-rose-500/20 text-rose-300 line-through";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={submittedQuiz}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${btnStyle}`}
                              >
                                <span className="font-mono mr-2 text-slate-400">{String.fromCharCode(65 + optIdx)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {submittedQuiz && q.explanation && (
                          <div className="text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                            <span className="font-semibold text-slate-300">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-2">
                    {submittedQuiz && (
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setSubmittedQuiz(false);
                        }}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                      </button>
                    )}

                    <button
                      onClick={() => setSubmittedQuiz(true)}
                      disabled={submittedQuiz || Object.keys(quizAnswers).length === 0}
                      className="ml-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg disabled:opacity-40 transition-all"
                    >
                      Submit & Grade Quiz
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  {studySet?.flashcards?.length ? (
                    <div className="w-full max-w-md space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-purple-400">
                          {studySet.flashcards[currentCardIndex]?.category || 'Card'}
                        </span>
                        <button
                          onClick={exportAnkiCsv}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Export Anki CSV
                        </button>
                      </div>

                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="h-64 w-full bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl transition-all relative select-none"
                      >
                        <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                          {isFlipped ? 'Answer' : 'Front'}
                        </span>

                        <p className="text-sm sm:text-base font-medium text-slate-100">
                          {isFlipped
                            ? studySet.flashcards[currentCardIndex]?.back
                            : studySet.flashcards[currentCardIndex]?.front}
                        </p>

                        <span className="absolute bottom-4 text-[11px] text-slate-500">
                          Click to {isFlipped ? 'see front' : 'flip answer'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
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
                  <div className={`p-5 rounded-full ${audioUrl || isPlayingTts ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'}`}>
                    <Volume2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">Audio Podcast Overview</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      {audioUrl || isPlayingTts
                        ? 'Audio overview ready! Listen to the synthesized narration below:'
                        : 'Synthesize document key findings into a clear, AI-narrated audio summary.'}
                    </p>
                  </div>

                  {audioUrl ? (
                    <div className="w-full max-w-md p-5 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-xl space-y-4">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-300">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        AI Voice Synthesis Stream
                      </div>

                      {!audioError ? (
                        <audio
                          controls
                          autoPlay
                          onError={() => setAudioError(true)}
                          className="w-full rounded-lg"
                          src={audioUrl}
                        >
                          Your browser does not support audio playback.
                        </audio>
                      ) : (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Direct MP3 playback restricted by browser context. Use Web Voice below.</span>
                        </div>
                      )}

                      {/* Interactive Web Speech Voice Playback Toggle */}
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={handleToggleTts}
                          className="w-full py-2.5 px-4 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-xl text-xs font-semibold text-purple-200 transition-all flex items-center justify-center gap-2"
                        >
                          {isPlayingTts ? (
                            <>
                              <Pause className="w-4 h-4 fill-purple-300" /> Pause Speech Reader
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-400" /> Play Narration with AI Voice
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleGenerateAudio}
                          disabled={generatingAudio}
                          className="text-xs text-slate-400 hover:text-white underline transition-colors"
                        >
                          {generatingAudio ? 'Regenerating...' : 'Regenerate Audio File'}
                        </button>
                      </div>

                      {audioText && (
                        <div className="text-left text-[11px] p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 max-h-32 overflow-y-auto">
                          <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-purple-400" /> Script Preview:
                          </div>
                          {audioText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 w-full max-w-sm">
                      <button
                        onClick={handleGenerateAudio}
                        disabled={generatingAudio}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

                      <button
                        onClick={handleToggleTts}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 transition-all flex items-center justify-center gap-2"
                      >
                        {isPlayingTts ? (
                          <>
                            <Pause className="w-4 h-4 fill-slate-300" /> Stop Speech Narration
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-400" /> Instant Browser Speech Narration
                          </>
                        )}
                      </button>
                    </div>
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
