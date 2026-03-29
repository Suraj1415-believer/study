"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, Download, Link as LinkIcon, Video, FileUp, X, Moon, Sun, Loader2, MessageSquare, ListChecks, FileQuestion, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [mode, setMode] = useState<"file" | "link" | "web">("file");
  const [file, setFile] = useState<File | null>(null);
  const [docs, setDocs] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    detailed_notes?: string; 
    one_line_points?: string; 
    quiz?: string; 
    flashcards?: {q: string, a: string}[];
    task_id?: string;
    docx_urls?: { detailed?: string; points?: string; quiz?: string; } 
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detailed" | "points" | "quiz" | "flashcards">("detailed");
  
  const [userApiKey, setUserApiKey] = useState("");
  
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key_custom");
    if (savedKey) setUserApiKey(savedKey);
  }, []);
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserApiKey(val);
    if (val.trim()) {
      localStorage.setItem("gemini_api_key_custom", val.trim());
    } else {
      localStorage.removeItem("gemini_api_key_custom");
    }
  };
  
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- THEME CLASSES ---
  const appBg = isDarkMode ? "bg-[#070b14] text-neutral-50" : "bg-[#f8fafc] text-slate-800";
  const cardBg = isDarkMode ? "bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" : "bg-white/80 border border-slate-200 shadow-xl shadow-slate-200/50";
  const inputBg = isDarkMode ? "bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-neutral-500" : "bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder-slate-400";
  const uploadAreaBg = isDarkMode ? "border-2 border-dashed border-white/20 bg-black/20 hover:border-indigo-500/50 hover:bg-indigo-500/5" : "border-2 border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50";
  const primaryText = isDarkMode ? "text-white" : "text-slate-900";
  const secondaryText = isDarkMode ? "text-neutral-300" : "text-slate-600";
  const mutedText = isDarkMode ? "text-neutral-400" : "text-slate-500";
  const accentGradient = isDarkMode ? "from-indigo-400 via-purple-400 to-emerald-400" : "from-indigo-600 via-purple-600 to-teal-500";
  const toggleBtnBg = isDarkMode ? "bg-white/10 text-yellow-300 hover:bg-white/20" : "bg-slate-800 text-blue-300 hover:bg-slate-700";

  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocs(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeDoc = (index: number) => {
    setDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!file && docs.length === 0 && !webUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    docs.forEach(doc => {
      formData.append("docs", doc);
    });
    if (focusTopic.trim()) {
      formData.append("focus_topic", focusTopic.trim());
    }
    if (webUrl.trim()) {
      formData.append("web_url", webUrl.trim());
    }
    if (userApiKey.trim()) {
      formData.append("api_key", userApiKey.trim());
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveTab("detailed");
    } catch (err: any) {
      setError(err.message || "Failed to upload and process video.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProcess = async () => {
    if (!url && docs.length === 0 && !webUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (url) {
      formData.append("url", url);
    }
    docs.forEach(doc => {
      formData.append("docs", doc);
    });
    if (focusTopic.trim()) {
      formData.append("focus_topic", focusTopic.trim());
    }
    if (webUrl.trim()) {
      formData.append("web_url", webUrl.trim());
    }
    if (userApiKey.trim()) {
      formData.append("api_key", userApiKey.trim());
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/api/process-link`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveTab("detailed");
    } catch (err: any) {
      setError(err.message || "Failed to process the video link. Make sure the URL is accessible.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim() || !result?.task_id) return;
    
    const newMessage = { role: "user", text: chatMessage };
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage("");
    setChatLoading(true);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: result.task_id,
          message: newMessage.text,
          history: chatHistory,
          api_key: userApiKey.trim() || undefined
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: "ai", text: data.response }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className={`min-h-screen ${appBg} p-8 md:p-16 selection:bg-indigo-500/30 relative overflow-hidden font-sans transition-colors duration-500`}>
      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all duration-300 shadow-lg ${toggleBtnBg} hover:scale-110 z-50`}
        title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Dynamic Background Gradients */}
      <div className={`fixed top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-[120px] rounded-full pointer-events-none animate-float transition-colors duration-1000 ${isDarkMode ? 'bg-indigo-600/20' : 'bg-blue-400/20'}`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none animate-float-delayed transition-colors duration-1000 ${isDarkMode ? 'bg-emerald-600/15' : 'bg-teal-300/30'}`} />
      <div className={`fixed top-[20%] left-[-10%] w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none animate-float transition-colors duration-1000 ${isDarkMode ? 'bg-purple-600/15' : 'bg-fuchsia-300/20'}`} />

      <div className="w-full max-w-[95%] mx-auto space-y-12 relative z-10 transition-all duration-500">
        <header className="space-y-6 text-center pt-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-2 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:-translate-y-1 ${isDarkMode ? 'bg-white/5 border border-white/10 text-indigo-400' : 'bg-white/80 border border-slate-200 text-indigo-600'}`}>
            <FileText className="w-8 h-8" />
          </div>
          <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight ${primaryText}`}>
            Study <span className={`text-transparent bg-clip-text bg-gradient-to-r ${accentGradient}`}>Synthesizer</span>
          </h1>
          <p className={`${secondaryText} text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed`}>
            Upload technical videos, links, or just supporting documents. Our AI will analyze the content to build comprehensive notes, concise highlights, and practice quizzes.
          </p>
        </header>

        {!result ? (
          <div className="flex flex-col xl:flex-row gap-12 w-full mx-auto justify-center">
            
            {/* LEFT COLUMN: Input Takers */}
            <div className="flex-1 max-w-3xl space-y-6 w-full fade-in slide-in-from-left-8 duration-700">
              {/* API KEY SETTINGS (Made Early) */}
              <div className={`w-full rounded-3xl p-6 transition-all backdrop-blur-md shadow-lg ${cardBg}`}>
                <div className="flex flex-col space-y-3">
                   <div className="flex items-center justify-between">
                      <label className={`text-base font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                         🔑 Add Your Gemini API Key
                      </label>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-400 font-semibold transition-colors flex items-center uppercase tracking-wide bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20"
                      >
                        <LinkIcon className="w-3 h-3 mr-1" /> Get Key Here
                      </a>
                   </div>
                   <p className={`text-sm ${mutedText} leading-relaxed font-medium`}>
                     Your key is securely saved entirely offline in your browser. It is never logged by our servers. 
                     1. Click <strong className="text-indigo-400">Get Key Here</strong>. 2. Create an API key. 3. Paste it below.
                   </p>
                   <input 
                     type="password"
                     value={userApiKey}
                     onChange={handleApiKeyChange}
                     placeholder="Paste your AIza... API key"
                     className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all shadow-inner font-mono text-sm tracking-widest ${inputBg}`}
                   />
                </div>
              </div>

              {/* UPLOAD FORM */}
              <div className={`w-full backdrop-blur-xl rounded-3xl p-8 transition-all hover:shadow-2xl h-fit ${cardBg}`}>
                <div className={`flex rounded-xl p-1 mb-8 ${isDarkMode ? 'bg-black/40 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}>
                  <button
                    onClick={() => setMode("file")}
                    className={`flex-1 flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all ${mode === "file" ? (isDarkMode ? "bg-white/10 text-white shadow-lg border border-white/10" : "bg-white text-indigo-600 shadow-md border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setMode("link")}
                    className={`flex-1 flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all ${mode === "link" ? (isDarkMode ? "bg-white/10 text-white shadow-lg border border-white/10" : "bg-white text-indigo-600 shadow-md border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Paste Link
                  </button>
                  <button
                    onClick={() => setMode("web")}
                    className={`flex-1 flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all ${mode === "web" ? (isDarkMode ? "bg-white/10 text-white shadow-lg border border-white/10" : "bg-white text-indigo-600 shadow-md border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Web Article
                  </button>
                </div>

                <div className="space-y-6">
                  {/* PRIMARY MEDIA INPUT */}
                  {mode === "file" ? (
                    <div 
                      className={`rounded-2xl p-10 text-center transition-all cursor-pointer group ${uploadAreaBg}`}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input 
                        id="file-upload" 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <Video className={`w-12 h-12 mx-auto transition-transform duration-300 group-hover:scale-110 mb-4 ${isDarkMode ? 'text-neutral-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                      {file ? (
                        <div className="space-y-1">
                          <p className={`text-lg font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{file.name}</p>
                          <p className={`text-sm ${mutedText}`}>Primary Video Selected</p>
                        </div>
                      ) : (
                        <p className={`text-base font-medium ${mutedText}`}>Click to select primary video (Optional)</p>
                      )}
                    </div>
                  ) : mode === "link" ? (
                    <div className="space-y-2 group">
                      <label className={`text-sm font-medium ml-1 transition-colors ${isDarkMode ? 'text-neutral-300 group-focus-within:text-indigo-400' : 'text-slate-600 group-focus-within:text-indigo-600'}`}>Video YouTube/Direct Link (Optional)</label>
                      <input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                        className={`w-full rounded-xl px-4 py-4 outline-none transition-all shadow-inner hover:shadow-md ${inputBg}`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 group">
                      <label className={`text-sm font-medium ml-1 transition-colors ${isDarkMode ? 'text-neutral-300 group-focus-within:text-indigo-400' : 'text-slate-600 group-focus-within:text-indigo-600'}`}>Web Article URL</label>
                      <input 
                        type="url"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="e.g. https://en.wikipedia.org/wiki/..."
                        className={`w-full rounded-xl px-4 py-4 outline-none transition-all shadow-inner hover:shadow-md ${inputBg}`}
                      />
                    </div>
                  )}

                  {/* SUPPLEMENTARY DOCUMENTS */}
                  <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between ml-1">
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Supplementary Details (Optional)</label>
                      <span className={`text-xs ${mutedText}`}>PDF, DOCX, PPTX</span>
                    </div>
                    
                    <div 
                      className={`border border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center hover:scale-[1.02] ${isDarkMode ? 'border-white/10 bg-black/20 hover:border-emerald-500/30 hover:bg-emerald-500/5' : 'border-slate-300 bg-slate-50 hover:border-emerald-500/50 hover:bg-emerald-50/50'}`}
                      onClick={() => document.getElementById('docs-upload')?.click()}
                    >
                      <input 
                        id="docs-upload" 
                        type="file" 
                        multiple
                        accept=".pdf,.docx,.pptx,.txt" 
                        className="hidden" 
                        onChange={handleDocsChange}
                      />
                      <FileUp className={`w-6 h-6 mb-2 ${isDarkMode ? 'text-neutral-500' : 'text-slate-400'}`} />
                      <p className={`text-sm ${mutedText}`}>Add slides, syllabi, or notes to build the ultimate exam study guide</p>
                    </div>
                    
                    {docs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {docs.map((d, idx) => (
                          <div key={idx} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm border animate-in zoom-in ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            <span className="truncate max-w-[150px]">{d.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeDoc(idx); }} className={`hover:scale-110 transition-transform ${isDarkMode ? 'hover:text-white' : 'hover:text-emerald-900'}`}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FOCUS TOPIC */}
                  <div className={`space-y-2 pt-4 border-t group ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                    <label className={`text-sm font-medium ml-1 transition-colors ${isDarkMode ? 'text-neutral-300 group-focus-within:text-purple-400' : 'text-slate-700 group-focus-within:text-purple-600'}`}>Specific Focus Topic (Optional)</label>
                    <input 
                      type="text"
                      value={focusTopic}
                      onChange={(e) => setFocusTopic(e.target.value)}
                      placeholder="e.g. React Hooks, Neural Networks, Chapter 4..."
                      className={`w-full rounded-xl px-4 py-3 outline-none transition-all shadow-inner hover:shadow-md ${isDarkMode ? 'bg-black/40 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-neutral-500' : 'bg-white border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>

                  <button
                    disabled={(!file && docs.length === 0 && !webUrl && !url) || loading}
                    onClick={mode === "file" ? handleUpload : mode === "link" ? handleLinkProcess : handleUpload}
                    className="w-full py-4 mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-lg font-bold rounded-xl focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-indigo-500/40"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="animate-pulse tracking-widest font-semibold">SYNTHESIZING...</span>
                      </div>
                    ) : (
                      <span className="tracking-wide">Generate Study Material</span>
                    )}
                  </button>
                  
                  {error && (
                    <div className={`p-4 rounded-xl text-center text-sm backdrop-blur-sm animate-in shake ${isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Feature Highlights */}
            <div className="w-full xl:w-96 flex-shrink-0 space-y-5 fade-in slide-in-from-right-8 duration-700">
              <h2 className={`text-2xl font-extrabold mb-4 px-2 flex items-center ${primaryText}`}>
                <span className="text-3xl mr-3">✨</span> Platform Features
              </h2>
              
              <div className={`p-6 rounded-3xl transition-all shadow-lg hover:-translate-y-1 ${cardBg}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <ListChecks className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${primaryText}`}>Smart Notes & Points</h3>
                <p className={`text-sm leading-relaxed ${mutedText}`}>We extract the messy core details into beautiful Markdown Deep Dives and ultra-concise 1-Line summaries.</p>
              </div>
              
              <div className={`p-6 rounded-3xl transition-all shadow-lg hover:-translate-y-1 ${cardBg}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  <FileQuestion className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${primaryText}`}>Mastery Quizzes</h3>
                <p className={`text-sm leading-relaxed ${mutedText}`}>Automatically generated multi-choice tests designed to challenge your understanding of the extracted material.</p>
              </div>

              <div className={`p-6 rounded-3xl transition-all shadow-lg hover:-translate-y-1 ${cardBg}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${primaryText}`}>Interactive Flashcards</h3>
                <p className={`text-sm leading-relaxed ${mutedText}`}>Grinds rote memorization by generating smart 3D-flipping flashcard decks straight from the core concepts.</p>
              </div>

              <div className={`p-6 rounded-3xl transition-all shadow-lg hover:-translate-y-1 ${cardBg}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${primaryText}`}>Study Buddy AI</h3>
                <p className={`text-sm leading-relaxed ${mutedText}`}>Ask endless follow-up questions to an embedded conversational chatbot uniquely aware of your entire topic.</p>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-8 w-full max-w-5xl mx-auto">
            <div className={`flex flex-col xl:flex-row items-center justify-between backdrop-blur-lg p-5 md:p-6 rounded-2xl border gap-4 transition-all hover:shadow-2xl ${cardBg}`}>
              <div className={`flex items-center space-x-3 pl-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>
                <CheckCircle2 className="w-8 h-8 drop-shadow-md" />
                <h2 className={`text-xl font-bold hidden md:block ${primaryText}`}>Analysis Complete</h2>
              </div>

              {/* Tab Navigation */}
              <div className={`flex rounded-xl p-1.5 w-full md:w-auto overflow-x-auto shrink-0 shadow-inner ${isDarkMode ? 'bg-black/40 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}>
                <button
                  onClick={() => setActiveTab("detailed")}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === "detailed" ? (isDarkMode ? "bg-white/10 text-indigo-300 shadow-md border border-white/5" : "bg-white text-indigo-700 shadow border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                >
                  Deep Dive Notes
                </button>
                <button
                  onClick={() => setActiveTab("points")}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === "points" ? (isDarkMode ? "bg-white/10 text-emerald-300 shadow-md border border-white/5" : "bg-white text-emerald-700 shadow border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                >
                  1-Line Highlights
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === "quiz" ? (isDarkMode ? "bg-white/10 text-purple-300 shadow-md border border-white/5" : "bg-white text-purple-700 shadow border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                >
                  Mastery Quiz
                </button>
                {result.flashcards && result.flashcards.length > 0 && (
                  <button
                    onClick={() => { setActiveTab("flashcards"); setFlashcardIndex(0); setShowAnswer(false); }}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${activeTab === "flashcards" ? (isDarkMode ? "bg-white/10 text-yellow-300 shadow-md border border-white/5" : "bg-white text-amber-600 shadow border border-slate-200") : `hover:scale-105 ${mutedText} hover:${primaryText}`}`}
                  >
                    Flashcards
                  </button>
                )}
              </div>

              {/* Download Option Based on Tab */}
              {result.docx_urls && activeTab !== "flashcards" && result.docx_urls[activeTab] && (
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.docx_urls[activeTab]}`}
                  download
                  className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 w-full md:w-auto whitespace-nowrap shrink-0 border shadow-lg hover:scale-105 hover:-translate-y-1 ${isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Export .docx</span>
                </a>
              )}
            </div>

            <div className={`backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-none transition-all ${cardBg}`}>
              {activeTab === "flashcards" && result.flashcards ? (
                <div className="flex flex-col items-center py-8">
                  <div 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="w-full max-w-lg cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                    style={{ perspective: "1500px" }}
                  >
                    <div 
                      className={`w-full min-h-[300px] flex items-center justify-center p-10 rounded-3xl border transition-all duration-500 shadow-2xl relative ${showAnswer ? (isDarkMode ? 'bg-emerald-900/40 border-emerald-500/40 shadow-emerald-900/50' : 'bg-emerald-50 border-emerald-300 shadow-emerald-200') : (isDarkMode ? 'bg-indigo-900/40 border-indigo-500/40 shadow-indigo-900/50' : 'bg-indigo-50 border-indigo-300 shadow-indigo-200')}`}
                      style={{ transformStyle: "preserve-3d", transform: showAnswer ? "rotateX(180deg)" : "rotateX(0deg)" }}
                    >
                      <div className={`text-xl md:text-2xl font-semibold text-center leading-relaxed backface-hidden ${showAnswer ? 'rotate-x-180 text-emerald-100' : (isDarkMode ? 'text-indigo-100' : 'text-indigo-900')}`} style={{ transform: showAnswer ? 'rotateX(180deg)' : 'none' }}>
                        {showAnswer ? result.flashcards[flashcardIndex].a : result.flashcards[flashcardIndex].q}
                      </div>
                      <div className={`absolute bottom-6 text-sm font-medium tracking-wide flex items-center ${showAnswer ? 'rotate-x-180 opacity-70 text-emerald-200' : `opacity-50 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-600'}`}`} style={{ transform: showAnswer ? 'rotateX(180deg)' : 'none' }}>
                         <span className="inline-block w-2 h-2 rounded-full mr-2 animate-ping bg-current"></span> Click to flip
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mt-12">
                    <button 
                      onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setShowAnswer(false); }}
                      disabled={flashcardIndex === 0}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 border shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'}`}
                    >Previous</button>
                    <span className={`font-bold px-5 py-2.5 rounded-xl border shadow-inner ${isDarkMode ? 'bg-black/40 text-neutral-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {flashcardIndex + 1} <span className="text-neutral-500 mx-1">/</span> {result.flashcards.length}
                    </span>
                    <button 
                      onClick={() => { setFlashcardIndex(Math.min(result.flashcards!.length - 1, flashcardIndex + 1)); setShowAnswer(false); }}
                      disabled={flashcardIndex === result.flashcards.length - 1}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 border shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'}`}
                    >Next</button>
                  </div>
                </div>
              ) : (result.detailed_notes || result.one_line_points || result.quiz) && (
                <div className="w-full">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className={`text-4xl md:text-5xl font-extrabold mt-8 mb-8 pb-4 border-b ${isDarkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-200'}`} {...props} />,
                      h2: ({node, ...props}) => <h2 className={`text-2xl md:text-3xl font-bold mt-12 mb-6 tracking-tight ${isDarkMode ? 'text-indigo-200' : 'text-indigo-800'}`} {...props} />,
                      h3: ({node, ...props}) => <h3 className={`text-xl font-bold mt-8 mb-4 ${isDarkMode ? 'text-emerald-300' : 'text-teal-700'}`} {...props} />,
                      p: ({node, ...props}) => <p className={`mb-6 leading-relaxed text-[1.05rem] ${secondaryText}`} {...props} />,
                      ul: ({node, ...props}) => <ul className={`ml-6 mb-8 list-disc marker:text-indigo-500 space-y-3 text-[1.05rem] ${secondaryText}`} {...props} />,
                      ol: ({node, ...props}) => <ol className={`ml-6 mb-8 list-decimal marker:text-emerald-500 space-y-3 text-[1.05rem] font-medium ${secondaryText}`} {...props} />,
                      li: ({node, ...props}) => <li className="pl-2" {...props} />,
                      strong: ({node, ...props}) => <strong className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} {...props} />,
                      a: ({node, ...props}) => <a className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500" {...props} />,
                      pre: ({node, ...props}) => <pre className={`my-8 rounded-2xl border p-6 overflow-x-auto text-sm font-mono leading-relaxed shadow-inner ${isDarkMode ? 'bg-black/50 border-white/10 text-neutral-300' : 'bg-slate-800 border-slate-700 text-slate-50'}`} {...props} />,
                      code({node, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={`px-2 py-1 rounded-md font-mono text-sm border ${isDarkMode ? 'bg-white/10 text-emerald-300 border-white/5' : 'bg-slate-100 text-teal-700 border-slate-200'}`} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {activeTab === "detailed" ? (result.detailed_notes || "") : activeTab === "points" ? (result.one_line_points || "") : (result.quiz || "")}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            {/* STUDY BUDDY CHAT */}
            <div className={`rounded-3xl p-6 md:p-8 mt-8 transition-all hover:shadow-2xl ${isDarkMode ? 'bg-black/30 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]' : 'bg-white/80 border border-slate-200 shadow-xl shadow-slate-200/50'}`}>
              <h3 className={`text-xl font-bold mb-6 flex items-center ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                <span className="text-2xl mr-3 drop-shadow-md">🤖</span> 
                Study Buddy Chat
              </h3>
              
              <div className="space-y-5 mb-6 max-h-[450px] overflow-y-auto pr-3 rounded-xl scroll-smooth">
                {chatHistory.length === 0 ? (
                  <div className={`text-center py-10 rounded-2xl border flex flex-col items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/5 text-neutral-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-2xl">✨</div>
                    <p className="text-lg font-medium">Ask me anything about these notes!</p>
                    <p className="text-sm opacity-70 mt-2">I have full context of all the extracted concepts.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-[1.05rem] leading-relaxed shadow-md ${msg.role === 'user' ? (isDarkMode ? 'bg-indigo-600 border border-indigo-500/50 text-indigo-50 rounded-br-sm' : 'bg-indigo-500 border border-indigo-600 text-white rounded-br-sm') : (isDarkMode ? 'bg-white/10 border border-white/10 text-neutral-200 rounded-bl-sm backdrop-blur-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm')}`}>
                        <div className={`prose max-w-none prose-p:my-1 prose-pre:my-3 prose-sm ${isDarkMode ? 'prose-invert' : 'prose-slate'}`}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-3xl rounded-bl-sm px-6 py-4 text-sm flex items-center shadow-md animate-pulse ${isDarkMode ? 'bg-white/5 border border-white/10 text-neutral-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      <div className={`w-2 h-2 rounded-full mr-1.5 animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`} style={{animationDelay: "0ms"}}></div>
                      <div className={`w-2 h-2 rounded-full mr-1.5 animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`} style={{animationDelay: "150ms"}}></div>
                      <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`} style={{animationDelay: "300ms"}}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`flex space-x-3 p-2.5 rounded-2xl border shadow-inner transition-colors focus-within:ring-2 focus-within:ring-indigo-500/30 ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask a question..."
                  className={`flex-1 bg-transparent px-4 py-3 outline-none text-base font-medium ${isDarkMode ? 'text-white placeholder-neutral-500' : 'text-slate-900 placeholder-slate-400'}`}
                />
                <button 
                  onClick={handleChatSubmit}
                  disabled={!chatMessage.trim() || chatLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 text-white px-8 py-3 rounded-xl disabled:opacity-50 disabled:hover:translate-y-0 font-bold tracking-wide transition-all shadow-md flex items-center justify-center shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
            
            <div className="text-center pb-16 mt-16">
              <button 
                onClick={() => { setResult(null); setFile(null); setDocs([]); setUrl(""); setFocusTopic(""); }}
                className={`inline-flex items-center px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg ${isDarkMode ? 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200'}`}
              >
                ← Synthesize Another Topic
              </button>
            </div>
          </div>
        )}

        {/* OWNER IDENTITY FOOTER */}
        <div className={`mt-24 mb-6 border-t pt-10 text-center max-w-4xl mx-auto flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
           <div className="relative w-24 h-24 mb-5 group cursor-pointer hover:scale-110 transition-transform duration-500">
             <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-spin-slow opacity-70 group-hover:opacity-100 blur-md transition-opacity"></div>
             <img src="/avatar.png" alt="Owner Profile" className={`relative z-10 w-full h-full object-cover rounded-full border-[3px] shadow-2xl ${isDarkMode ? 'border-neutral-900' : 'border-white'}`} />
           </div>
           
           <h3 className={`text-2xl font-extrabold tracking-tight mb-2 ${primaryText}`}>Suraj M S</h3>
           <p className={`text-sm tracking-wide font-semibold flex items-center justify-center space-x-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
             Owner & Creator 
           </p>
        </div>

      </div>
    </main>
  );
}
