import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Globe, ChevronRight, Edit, Trash2, X, Image as ImageIcon, Database, Sun, Moon, Download, Upload, Lock } from 'lucide-react';
import localforage from 'localforage';
import { Term, Category, Language } from './types';
import { CATEGORIES, MOCK_TERMS, CATEGORY_COLORS } from './data';

// Sound hook stub
const playSound = (type: 'click' | 'hover' | 'error') => {
  // console.log(`Playing sound: ${type}`);
};

// Simple CSV Parser
function parseCSV(str: string): string[][] {
  const arr: string[][] = [];
  let quote = false;
  let row = 0, col = 0;
  for (let c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c+1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
      if (cc == '"') { quote = !quote; continue; }
      if (cc == ',' && !quote) { ++col; continue; }
      if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
      if (cc == '\n' && !quote) { ++row; col = 0; continue; }
      if (cc == '\r' && !quote) { ++row; col = 0; continue; }
      arr[row][col] += cc;
  }
  return arr;
}

const UI_TEXTS = {
  JP: {
    searchPlaceholder: "Search terms... (語句, 読み方, 英語)",
    recordsFound: "RECORDS FOUND",
    noRecords: "NO RECORDS MATCHING QUERY",
    systemLang: "SYSTEM LANGUAGE",
    databanks: "DATABANKS",
    all: "全て (ALL)",
    import: "IMPORT",
    export: "EXPORT",
    addTerm: "ADD TERM",
    selectTerm: "SELECT A TERM TO VIEW DETAILS",
    noImage: "NO IMAGE DATA",
    common: "通称 (Common)",
    english: "英語 (English)",
    meaning: "意味 (Meaning)",
    updated: "UPDATED",
    by: "BY",
    edit: "EDIT",
    delete: "DELETE",
    editTerm: "EDIT TERM",
    addNewTerm: "ADD NEW TERM",
    term: "語句 (Term) *",
    reading: "読み方 (Reading)",
    category: "Category",
    cancel: "CANCEL",
    saveTerm: "SAVE TERM",
    updateTerm: "UPDATE TERM",
    deleteConfirm: "Are you sure you want to delete this term?",
    importSuccess: "Successfully imported terms.",
    imageUpload: "Image Upload",
    imageUrl: "Image URL",
    or: "OR",
    chooseFile: "Choose File",
    author: "作成者 (Author)",
    history: "編集履歴 (History)"
  },
  MN: {
    searchPlaceholder: "Хайх... (Үг, Уншлага, Англи)",
    recordsFound: "ИЛЭРЦ ОЛДЛОО",
    noRecords: "ХАЙЛТАД ТОХИРОХ ҮР ДҮН ОЛДСОНГҮЙ",
    systemLang: "СИСТЕМИЙН ХЭЛ",
    databanks: "ӨГӨГДЛИЙН САН",
    all: "Бүгд (ALL)",
    import: "ОРУУЛАХ",
    export: "ГАРГАХ",
    addTerm: "ҮГ НЭМЭХ",
    selectTerm: "ДЭЛГЭРЭНГҮЙГ ХАРАХЫН ТУЛД ҮГ СОНГОНО УУ",
    noImage: "ЗУРАГГҮЙ",
    common: "Түгээмэл нэр",
    english: "Англи хэл",
    meaning: "Утга",
    updated: "ШИНЭЧЛЭГДСЭН",
    by: "ХЭН",
    edit: "ЗАСАХ",
    delete: "УСТГАХ",
    editTerm: "ҮГ ЗАСАХ",
    addNewTerm: "ШИНЭ ҮГ НЭМЭХ",
    term: "Үг *",
    reading: "Уншлага",
    category: "Ангилал",
    cancel: "ЦУЦЛАХ",
    saveTerm: "ХАДГАЛАХ",
    updateTerm: "ШИНЭЧЛЭХ",
    deleteConfirm: "Та энэ үгийг устгахдаа итгэлтэй байна уу?",
    importSuccess: "Амжилттай орууллаа.",
    imageUpload: "Зураг оруулах",
    imageUrl: "Зургийн холбоос (URL)",
    or: "ЭСВЭЛ",
    chooseFile: "Файл сонгох",
    author: "Нэмсэн хүн",
    history: "Засварын түүх"
  },
  ENG: {
    searchPlaceholder: "Search terms... (Term, Reading, English)",
    recordsFound: "RECORDS FOUND",
    noRecords: "NO RECORDS MATCHING QUERY",
    systemLang: "SYSTEM LANGUAGE",
    databanks: "DATABANKS",
    all: "All",
    import: "IMPORT",
    export: "EXPORT",
    addTerm: "ADD TERM",
    selectTerm: "SELECT A TERM TO VIEW DETAILS",
    noImage: "NO IMAGE DATA",
    common: "Common Name",
    english: "English",
    meaning: "Meaning",
    updated: "UPDATED",
    by: "BY",
    edit: "EDIT",
    delete: "DELETE",
    editTerm: "EDIT TERM",
    addNewTerm: "ADD NEW TERM",
    term: "Term *",
    reading: "Reading",
    category: "Category",
    cancel: "CANCEL",
    saveTerm: "SAVE TERM",
    updateTerm: "UPDATE TERM",
    deleteConfirm: "Are you sure you want to delete this term?",
    importSuccess: "Successfully imported terms.",
    imageUpload: "Image Upload",
    imageUrl: "Image URL",
    or: "OR",
    chooseFile: "Choose File",
    author: "Author Name",
    history: "Edit History"
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [terms, setTerms] = useState<Term[]>(MOCK_TERMS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedLang, setSelectedLang] = useState<Language>('JP');
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(MOCK_TERMS[0]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [previewTerm, setPreviewTerm] = useState<Term | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullPreviewRef = useRef<HTMLDivElement>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    localforage.getItem<Term[]>('crascad_terms').then((savedTerms) => {
      if (savedTerms && savedTerms.length > 0) {
        setTerms(savedTerms);
        setSelectedTerm(savedTerms[0]);
      }
      setIsLoaded(true);
    }).catch((err) => {
      console.error("Failed to load terms from storage", err);
      setIsLoaded(true);
    });
  }, []);

  // Save data to IndexedDB whenever terms change
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('crascad_terms', terms).catch(err => {
        console.error("Failed to save terms to storage", err);
      });
    }
  }, [terms, isLoaded]);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Filter terms
  const filteredTerms = terms.filter(t => {
    const matchesCat = selectedCategory === 'ALL' || t.categories.includes(selectedCategory as Category);
    const q = searchQuery.toLowerCase();
    const matchesSearch = t.goku.toLowerCase().includes(q) || 
                          t.yomikata.toLowerCase().includes(q) || 
                          t.eigo.toLowerCase().includes(q) ||
                          t.imi.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Handlers
  const handleFullPreviewMouseMove = (e: React.MouseEvent) => {
    if (!fullPreviewRef.current) return;
    const rect = fullPreviewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Less rotation for the large modal
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;
    
    fullPreviewRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleFullPreviewMouseLeave = () => {
    if (!fullPreviewRef.current) return;
    fullPreviewRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  const handleAddOrEdit = (term: Term) => {
    if (editingTerm) {
      setTerms(terms.map(t => t.id === term.id ? term : t));
      if (selectedTerm?.id === term.id) setSelectedTerm(term);
    } else {
      // Generate sequential ID based on existing terms
      const ids = terms.map(t => parseInt(t.id.replace('TRM-', ''), 10)).filter(n => !isNaN(n));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const newId = `TRM-${(maxId + 1).toString().padStart(3, '0')}`;
      const newTerm = { ...term, id: newId };
      // Add new term to the end of the list (newest at the bottom)
      setTerms([...terms, newTerm]);
    }
    setIsAddModalOpen(false);
    setEditingTerm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(UI_TEXTS[selectedLang].deleteConfirm)) {
      setTerms(terms.filter(t => t.id !== id));
      if (selectedTerm?.id === id) setSelectedTerm(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['id', 'goku', 'yomikata', 'tsushou', 'eigo', 'imi', 'categories', 'image', 'lastEditedBy', 'updatedAt', 'editHistory'];
    const csvContent = [
      headers.join(','),
      ...terms.map(t => headers.map(h => {
        if (h === 'categories') {
          return `"${t.categories.join(';')}"`;
        }
        if (h === 'editHistory') {
          return `"${(JSON.stringify(t.editHistory || [])).replace(/"/g, '""')}"`;
        }
        return `"${(t[h as keyof Term] || '').toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    // Add BOM (Byte Order Mark) for UTF-8 so Excel opens it correctly with Japanese characters
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'crascad_terms.csv';
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result as string;
      
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }
      
      const rows = parseCSV(text);
      if (rows.length < 2) return;
      
      const headers = rows[0].map(h => h.trim());
      const newTerms: Term[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length && !row.join('').trim()) continue;
        
        const term: any = {};
        headers.forEach((h, index) => {
          if (h === 'categories' || h === 'category') {
            const catStr = row[index] || '';
            term.categories = catStr.split(';').map(c => c.trim()).filter(Boolean) as Category[];
            if (term.categories.length === 0) term.categories = ['一般'];
          } else if (h === 'editHistory') {
            try {
              term.editHistory = JSON.parse(row[index] || '[]');
            } catch (e) {
              term.editHistory = [];
            }
          } else {
            term[h] = row[index] || '';
          }
        });
        
        if (term.id && term.goku) {
          newTerms.push(term as Term);
        }
      }
      
      if (newTerms.length > 0) {
        setTerms([...terms.filter(t => !newTerms.find(nt => nt.id === t.id)), ...newTerms]);
        alert(`${UI_TEXTS[selectedLang].importSuccess} (${newTerms.length})`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative">
      <div className="bg-noise"></div>
      <div className="bg-grid"></div>

      {/* Sidebar */}
      <Sidebar 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onAdd={() => { playSound('click'); setEditingTerm(null); setIsAddModalOpen(true); }}
        onExport={handleExportCSV}
        onImportClick={() => fileInputRef.current?.click()}
      />
      
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 p-4 md:p-6 gap-6">
        {/* Header / Search */}
        <header className="flex items-center gap-4 glass-panel p-4 rounded-xl shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tech-blue opacity-70" size={20} />
            <input 
              type="text" 
              placeholder={UI_TEXTS[selectedLang].searchPlaceholder} 
              className="w-full bg-transparent border border-border-color rounded-lg py-2 pl-10 pr-4 text-text-main placeholder-tech-blue/40 focus:outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => playSound('hover')}
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-tech-blue/60 font-mono text-sm">
            <Database size={16} />
            <span>{filteredTerms.length} {UI_TEXTS[selectedLang].recordsFound}</span>
          </div>
        </header>

        {/* Content Area: Table + Preview */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Table Container */}
          <div className="flex-2 glass-panel rounded-xl overflow-hidden flex flex-col w-full lg:w-2/3">
            <div className="overflow-auto flex-1 p-2">
              <table className="w-full text-left border-collapse tech-table">
                <thead className="sticky top-0 bg-bg-main/90 backdrop-blur z-10">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">{UI_TEXTS[selectedLang].term.replace(' *', '')}</th>
                    <th className="p-3">{UI_TEXTS[selectedLang].reading}</th>
                    <th className="p-3 hidden sm:table-cell">{UI_TEXTS[selectedLang].english}</th>
                    <th className="p-3 hidden md:table-cell">{UI_TEXTS[selectedLang].category}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredTerms.map((term, i) => (
                      <motion.tr 
                        key={term.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 }}
                        className={`cursor-pointer ${selectedTerm?.id === term.id ? 'selected' : ''}`}
                        onClick={() => { playSound('click'); setSelectedTerm(term); }}
                        onMouseEnter={() => playSound('hover')}
                      >
                        <td className="p-3 font-mono text-xs text-tech-blue/70">{term.id}</td>
                        <td className="p-3 font-bold text-text-main">{term.goku}</td>
                        <td className="p-3 text-sm text-text-muted">{term.yomikata}</td>
                        <td className="p-3 text-sm hidden sm:table-cell text-text-muted">{term.eigo}</td>
                        <td className="p-3 text-xs hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {term.categories.map(cat => (
                              <span key={cat} className={`px-2 py-1 border rounded whitespace-nowrap ${CATEGORY_COLORS[cat as Category] || 'bg-tech-blue/10 text-tech-blue border-border-color'}`}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredTerms.length === 0 && (
                <div className="p-8 text-center text-tech-blue/50 font-mono">
                  {UI_TEXTS[selectedLang].noRecords}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <PreviewPanel 
            term={selectedTerm} 
            lang={selectedLang}
            onEdit={(t) => { setEditingTerm(t); setIsAddModalOpen(true); }}
            onDelete={(id) => handleDelete(id)}
            onPreviewClick={(t) => setPreviewTerm(t)}
          />
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddTermModal 
            onClose={() => { setIsAddModalOpen(false); setEditingTerm(null); }} 
            onAdd={handleAddOrEdit} 
            initialData={editingTerm}
            lang={selectedLang}
          />
        )}
      </AnimatePresence>

      {/* Full Screen Term Preview Modal */}
      <AnimatePresence>
        {previewTerm && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 overflow-y-auto"
            onClick={() => setPreviewTerm(null)}
          >
            <motion.div 
              ref={fullPreviewRef}
              onMouseMove={handleFullPreviewMouseMove}
              onMouseLeave={handleFullPreviewMouseLeave}
              initial={{ scale: 0.8, y: 40, opacity: 0, rotateX: 10 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="relative max-w-4xl w-full glass-panel rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,160,233,0.3)] flex flex-col my-auto border border-tech-blue/30 transition-transform duration-200 ease-out"
              onClick={(e) => e.stopPropagation()}
              style={{ perspective: 1000 }}
            >
              <button 
                onClick={() => setPreviewTerm(null)}
                className="absolute top-4 right-4 z-20 text-text-muted hover:text-tech-blue bg-panel-inner/50 hover:bg-panel-inner p-2 rounded-full transition-all hover:rotate-90 duration-300"
              >
                <X size={24} />
              </button>
              
              <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                {/* Left side - Details */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6 border-b md:border-b-0 md:border-r border-border-color relative"
                >
                  <div className="absolute top-0 left-0 w-32 h-32 bg-tech-blue/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {previewTerm.categories.map(cat => (
                        <span key={cat} className={`px-3 py-1 border rounded-full text-xs font-mono ${CATEGORY_COLORS[cat as Category] || 'bg-tech-blue/10 text-tech-blue border-border-color'}`}>
                          {cat}
                        </span>
                      ))}
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-2">{previewTerm.goku}</h2>
                    <p className="text-tech-blue text-lg mb-6">{previewTerm.yomikata}</p>
                    
                    <div className="flex flex-col gap-5">
                      <DetailRow label={UI_TEXTS[selectedLang].common} value={previewTerm.tsushou} />
                      <DetailRow label={UI_TEXTS[selectedLang].english} value={previewTerm.eigo} />
                      
                      <div>
                        <div className="text-xs text-tech-blue/80 font-mono mb-2 uppercase tracking-wider">{UI_TEXTS[selectedLang].meaning}</div>
                        <div className="text-base text-text-main leading-relaxed bg-panel-inner p-4 rounded-lg border border-border-color">
                          {previewTerm.imi}
                        </div>
                      </div>

                      {previewTerm.editHistory && previewTerm.editHistory.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-tech-blue/80 font-mono mb-2 uppercase tracking-wider">{UI_TEXTS[selectedLang].history}</div>
                          <div className="flex flex-col gap-2 bg-panel-inner p-4 rounded-lg border border-border-color max-h-40 overflow-y-auto">
                            {previewTerm.editHistory.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm border-b border-border-color/50 pb-2 last:border-0 last:pb-0">
                                <span className="text-text-main font-medium">{entry.author}</span>
                                <span className="text-text-muted font-mono text-xs">{entry.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 flex justify-between items-center text-xs text-text-muted font-mono relative z-10">
                    <div>{UI_TEXTS[selectedLang].updated}: {previewTerm.updatedAt}</div>
                    <div>{UI_TEXTS[selectedLang].by}: {previewTerm.lastEditedBy}</div>
                  </div>
                </motion.div>
                
                {/* Right side - Image */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="w-full md:w-2/5 bg-input-bg relative flex items-center justify-center min-h-[250px] md:min-h-0 shrink-0"
                >
                  {previewTerm.image ? (
                    <img 
                      src={previewTerm.image} 
                      alt={previewTerm.goku} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous" 
                    />
                  ) : (
                    <div className="text-tech-blue/30 flex flex-col items-center gap-3">
                      <ImageIcon size={48} />
                      <span className="text-sm font-mono">{UI_TEXTS[selectedLang].noImage}</span>
                    </div>
                  )}
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 text-tech-blue font-mono text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-tech-blue/30">
                    {previewTerm.id}
                  </div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-tech-blue/30"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-tech-blue/30"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-tech-blue/30"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-tech-blue/30"></div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Login Screen Component ---
function LoginScreen({ onLogin, isDarkMode }: { onLogin: () => void, isDarkMode: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'crascad') {
      playSound('click');
      onLogin();
    } else {
      playSound('error');
      setError('ACCESS DENIED: INCORRECT PASSWORD');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <div className="bg-noise"></div>
      <div className="bg-grid"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-xl w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(0,160,233,0.15)] mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-tech-blue rounded flex items-center justify-center text-white font-bold text-3xl flicker shadow-[0_0_20px_var(--tech-blue)] mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-text-main glitch-text" data-text="CRASCAD">CRASCAD</h1>
          <p className="text-xs text-tech-blue font-mono tracking-widest uppercase mt-2">用語集autoliv</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-tech-blue/80 font-mono uppercase tracking-wider text-center">Enter Password</label>
            <input 
              type="password" 
              className="bg-input-bg border border-border-color rounded p-3 text-text-main focus:outline-none focus:border-tech-blue text-lg text-center tracking-widest font-mono"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          
          <div className="h-4">
            {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber text-xs text-center font-mono">{error}</motion.div>}
          </div>
          
          <button type="submit" className="tech-button w-full py-3 rounded font-bold mt-2 tracking-widest">
            AUTHENTICATE
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Sidebar Component ---
function Sidebar({ selectedCategory, setSelectedCategory, selectedLang, setSelectedLang, isDarkMode, setIsDarkMode, onAdd, onExport, onImportClick }: any) {
  return (
    <aside className="w-full md:w-64 lg:w-72 glass-panel border-r border-border-color flex flex-col z-20 h-auto md:h-screen shrink-0">
      <div className="p-6 border-b border-border-color flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-tech-blue rounded flex items-center justify-center text-white font-bold text-xl flicker shadow-[0_0_15px_var(--tech-blue)]">
          C
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-widest text-text-main glitch-text" data-text="CRASCAD">CRASCAD</h1>
          <p className="text-[10px] text-tech-blue font-mono tracking-widest uppercase">Technical Glossary</p>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-tech-blue hover:bg-tech-blue/10 rounded transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
        {/* Language Selector */}
        <div>
          <div className="text-xs text-tech-blue/60 font-mono mb-2 flex items-center gap-2">
            <Globe size={14} /> {UI_TEXTS[selectedLang].systemLang}
          </div>
          <div className="flex bg-input-bg rounded border border-border-color p-1">
            {['JP', 'MN', 'ENG'].map(lang => (
              <button
                key={lang}
                onClick={() => { playSound('click'); setSelectedLang(lang); }}
                className={`flex-1 text-xs py-1.5 rounded transition-colors ${selectedLang === lang ? 'bg-tech-blue/20 text-tech-blue font-bold' : 'text-text-muted hover:text-text-main'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="text-xs text-tech-blue/60 font-mono mb-2">{UI_TEXTS[selectedLang].databanks}</div>
          <ul className="flex flex-col gap-1">
            <li 
              className={`px-3 py-2 rounded cursor-pointer text-sm transition-all flex items-center justify-between group ${selectedCategory === 'ALL' ? 'bg-tech-blue/15 text-tech-blue border-l-2 border-tech-blue' : 'text-text-muted hover:bg-input-bg border-l-2 border-transparent'}`}
              onClick={() => { playSound('click'); setSelectedCategory('ALL'); }}
            >
              <span>{UI_TEXTS[selectedLang].all}</span>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedCategory === 'ALL' ? 'opacity-100' : ''}`} />
            </li>
            {CATEGORIES.map(cat => {
              const colorClass = CATEGORY_COLORS[cat] || '';
              // Extract text color from the class string for the active state
              const textMatch = colorClass.match(/text-([a-z]+-\d+)/);
              const activeTextColor = textMatch ? `text-${textMatch[1]}` : 'text-tech-blue';
              const activeBorderColor = textMatch ? `border-${textMatch[1]}` : 'border-tech-blue';
              const activeBgColor = textMatch ? `bg-${textMatch[1]}/15` : 'bg-tech-blue/15';

              return (
                <li 
                  key={cat}
                  className={`px-3 py-2 rounded cursor-pointer text-sm transition-all flex items-center justify-between group ${selectedCategory === cat ? `${activeBgColor} ${activeTextColor} border-l-2 ${activeBorderColor}` : 'text-text-muted hover:bg-input-bg border-l-2 border-transparent'}`}
                  onClick={() => { playSound('click'); setSelectedCategory(cat); }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colorClass.split(' ')[0].replace('/20', '')}`}></span>
                    <span>{cat}</span>
                  </div>
                  <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedCategory === cat ? 'opacity-100' : ''}`} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-border-color shrink-0 flex flex-col gap-2">
        <div className="flex gap-2">
          <button 
            onClick={onImportClick}
            className="tech-button flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Upload size={14} /> {UI_TEXTS[selectedLang].import}
          </button>
          <button 
            onClick={onExport}
            className="tech-button flex-1 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Download size={14} /> {UI_TEXTS[selectedLang].export}
          </button>
        </div>
        <button 
          onClick={onAdd}
          className="tech-button w-full py-3 rounded flex items-center justify-center gap-2 font-bold mt-2"
        >
          <Plus size={18} /> {UI_TEXTS[selectedLang].addTerm}
        </button>
      </div>
    </aside>
  );
}

// --- Preview Panel Component ---
function PreviewPanel({ term, lang, onEdit, onDelete, onPreviewClick }: { term: Term | null, lang: Language, onEdit: (t: Term) => void, onDelete: (id: string) => void, onPreviewClick: (t: Term) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 3D Tilt effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    panelRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!panelRef.current) return;
    panelRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  if (!term) {
    return (
      <div className="flex-1 lg:w-1/3 glass-panel rounded-xl flex items-center justify-center text-tech-blue/40 font-mono">
        {UI_TEXTS[lang].selectTerm}
      </div>
    );
  }

  return (
    <motion.div 
      key={term.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden transition-transform duration-200 ease-out cursor-pointer hover:shadow-[0_0_30px_rgba(0,160,233,0.1)] group"
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => { playSound('click'); onPreviewClick(term); }}
    >
      {/* Hover Overlay for entire panel */}
      <div className="absolute inset-0 bg-tech-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 flex items-center justify-center">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-mono flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <Search size={16} /> FULL PREVIEW
        </div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-border-color relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-tech-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="flex flex-wrap gap-1">
            {term.categories.map(cat => (
              <span key={cat} className={`px-2 py-1 border rounded text-xs font-mono ${CATEGORY_COLORS[cat as Category] || 'bg-tech-blue/10 text-tech-blue border-border-color'}`}>
                {cat}
              </span>
            ))}
          </div>
          <span className="text-xs text-text-muted font-mono">{term.id}</span>
        </div>
        <h2 className="text-3xl font-bold text-text-main mb-1 relative z-10">{term.goku}</h2>
        <p className="text-tech-blue text-sm relative z-10">{term.yomikata}</p>
      </div>

      {/* Image */}
      <div className="w-full h-48 bg-input-bg border-b border-border-color relative flex items-center justify-center overflow-hidden shrink-0">
        {term.image ? (
          <>
            <img 
              src={term.image} 
              alt={term.goku} 
              className="w-full h-full object-cover opacity-80" 
              crossOrigin="anonymous" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-main to-transparent pointer-events-none"></div>
          </>
        ) : (
          <div className="text-tech-blue/30 flex flex-col items-center gap-2">
            <ImageIcon size={32} />
            <span className="text-xs font-mono">{UI_TEXTS[lang].noImage}</span>
          </div>
        )}
        {/* Decorative corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-tech-blue/50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-tech-blue/50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-tech-blue/50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-tech-blue/50"></div>
      </div>

      {/* Details */}
      <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
        <DetailRow label={UI_TEXTS[lang].common} value={term.tsushou} />
        <DetailRow label={UI_TEXTS[lang].english} value={term.eigo} />
        
        <div className="mt-2">
          <div className="text-[10px] text-tech-blue/60 font-mono mb-1 uppercase tracking-wider">{UI_TEXTS[lang].meaning}</div>
          <div className="text-sm text-text-main leading-relaxed bg-panel-inner p-3 rounded border border-border-color">
            {term.imi}
          </div>
        </div>

        {term.editHistory && term.editHistory.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] text-tech-blue/60 font-mono mb-1 uppercase tracking-wider">{UI_TEXTS[lang].history}</div>
            <div className="flex flex-col gap-1 bg-panel-inner p-3 rounded border border-border-color max-h-32 overflow-y-auto">
              {term.editHistory.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-border-color/50 pb-1 last:border-0 last:pb-0">
                  <span className="text-text-main">{entry.author}</span>
                  <span className="text-text-muted font-mono text-[10px]">{entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border-color flex justify-between items-center text-xs text-text-muted font-mono">
          <div>{UI_TEXTS[lang].updated}: {term.updatedAt}</div>
          <div>{UI_TEXTS[lang].by}: {term.lastEditedBy}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border-color flex gap-3 bg-input-bg shrink-0 relative z-50">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(term); }}
          className="tech-button flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm"
        >
          <Edit size={16} /> {UI_TEXTS[lang].edit}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(term.id); }}
          className="tech-button amber flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 size={16} /> {UI_TEXTS[lang].delete}
        </button>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-tech-blue/60 font-mono mb-1 uppercase tracking-wider">{label}</span>
      <span className="text-text-main text-sm">{value}</span>
    </div>
  );
}

// --- Add Modal Component ---
function AddTermModal({ onClose, onAdd, initialData, lang }: { onClose: () => void, onAdd: (t: Term) => void, initialData: Term | null, lang: Language }) {
  const [formData, setFormData] = useState<Partial<Term>>(initialData || {
    categories: ['一般'],
    lastEditedBy: localStorage.getItem('crascad_author') || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (cat: Category) => {
    const currentCats = formData.categories || [];
    if (currentCats.includes(cat)) {
      setFormData({ ...formData, categories: currentCats.filter(c => c !== cat) });
    } else {
      setFormData({ ...formData, categories: [...currentCats, cat] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.goku) return;
    
    if (formData.lastEditedBy) {
      localStorage.setItem('crascad_author', formData.lastEditedBy);
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const currentAuthor = formData.lastEditedBy || 'Unknown';
    
    let newHistory = formData.editHistory ? [...formData.editHistory] : [];
    
    // Seed history for older terms that don't have it
    if (initialData && newHistory.length === 0 && initialData.lastEditedBy) {
      newHistory.push({ author: initialData.lastEditedBy, date: initialData.updatedAt });
    }
    
    // Add new history entry if it's different from the last one
    const lastEntry = newHistory[newHistory.length - 1];
    if (!lastEntry || lastEntry.author !== currentAuthor || lastEntry.date !== currentDate) {
      newHistory.push({ author: currentAuthor, date: currentDate });
    }
    
    const newTerm: Term = {
      id: formData.id || `TRM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      goku: formData.goku || '',
      yomikata: formData.yomikata || '',
      tsushou: formData.tsushou || '',
      eigo: formData.eigo || '',
      imi: formData.imi || '',
      categories: (formData.categories && formData.categories.length > 0) ? formData.categories as Category[] : ['一般'],
      lastEditedBy: currentAuthor,
      updatedAt: currentDate,
      image: formData.image,
      editHistory: newHistory
    };
    onAdd(newTerm);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="glass-panel w-full max-w-lg rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,160,233,0.15)] my-auto max-h-[90vh] flex flex-col"
      >
        <div className="p-4 border-b border-border-color flex justify-between items-center bg-tech-blue/5 shrink-0">
          <h3 className="text-lg font-bold text-text-main tracking-widest">{initialData ? UI_TEXTS[lang].editTerm : UI_TEXTS[lang].addNewTerm}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-tech-blue transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input label={UI_TEXTS[lang].term} value={formData.goku} onChange={(v: string) => setFormData({...formData, goku: v})} required />
            <Input label={UI_TEXTS[lang].reading} value={formData.yomikata} onChange={(v: string) => setFormData({...formData, yomikata: v})} />
            <Input label={UI_TEXTS[lang].common} value={formData.tsushou} onChange={(v: string) => setFormData({...formData, tsushou: v})} />
            <Input label={UI_TEXTS[lang].english} value={formData.eigo} onChange={(v: string) => setFormData({...formData, eigo: v})} />
            <div className="col-span-2">
              <Input label={UI_TEXTS[lang].author} value={formData.lastEditedBy} onChange={(v: string) => setFormData({...formData, lastEditedBy: v})} required />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-tech-blue/80 font-mono uppercase tracking-wider">{UI_TEXTS[lang].category}</label>
            <div className="flex flex-wrap gap-2 bg-input-bg border border-border-color rounded p-3">
              {CATEGORIES.map(c => {
                const isChecked = (formData.categories || []).includes(c);
                const colorClass = CATEGORY_COLORS[c] || '';
                
                return (
                  <label 
                    key={c} 
                    className={`flex items-center gap-2 cursor-pointer text-sm transition-colors px-2 py-1 rounded border ${isChecked ? colorClass : 'border-transparent text-text-muted hover:bg-panel-inner'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isChecked}
                      onChange={() => toggleCategory(c)}
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-tech-blue/80 font-mono uppercase tracking-wider">{UI_TEXTS[lang].meaning}</label>
            <textarea 
              className="bg-input-bg border border-border-color rounded p-2 text-text-main focus:outline-none focus:border-tech-blue text-sm min-h-[80px]"
              value={formData.imi}
              onChange={e => setFormData({...formData, imi: e.target.value})}
            />
          </div>

          {/* Image Upload / URL Section */}
          <div className="flex flex-col gap-2 border border-border-color rounded p-3 bg-input-bg">
            <label className="text-[10px] text-tech-blue/80 font-mono uppercase tracking-wider">{UI_TEXTS[lang].imageUpload}</label>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <input 
                  type="text" 
                  placeholder={UI_TEXTS[lang].imageUrl}
                  className="w-full bg-panel-inner border border-border-color rounded p-2 text-text-main focus:outline-none focus:border-tech-blue text-sm"
                  value={formData.image || ''}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                />
              </div>
              
              <span className="text-xs text-text-muted font-mono">{UI_TEXTS[lang].or}</span>
              
              <div className="flex-1 w-full relative">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full tech-button py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <Upload size={14} /> {UI_TEXTS[lang].chooseFile}
                </button>
              </div>
            </div>
            
            {formData.image && (
              <div className="mt-2 relative h-24 w-full bg-black/20 rounded overflow-hidden flex items-center justify-center border border-border-color">
                <img src={formData.image} alt="Preview" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, image: ''})}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3 shrink-0 pt-2 border-t border-border-color">
            <button type="button" onClick={onClose} className="tech-button flex-1 py-2 rounded text-sm border-gray-600 text-text-muted hover:border-gray-400 hover:text-text-main hover:bg-input-bg">
              {UI_TEXTS[lang].cancel}
            </button>
            <button type="submit" className="tech-button flex-1 py-2 rounded text-sm font-bold bg-tech-blue/10">
              {initialData ? UI_TEXTS[lang].updateTerm : UI_TEXTS[lang].saveTerm}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, required }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-tech-blue/80 font-mono uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        required={required}
        className="bg-input-bg border border-border-color rounded p-2 text-text-main focus:outline-none focus:border-tech-blue text-sm"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
