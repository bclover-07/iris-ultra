'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Trash2, BarChart3, Sparkles, Brain, UploadCloud, Folder, Share2, Download, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, addEdge, Connection, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface FlowData { nodes: any[]; edges: any[]; }
interface Attachment { name: string; url: string; type: string; }
interface NoteItem { 
  _id: string; 
  title: string; 
  content: string; 
  tags: string[]; 
  hasChart: boolean; 
  chartData?: any;
  flowData?: FlowData; 
  createdAt: string; 
  isAiNote: boolean; 
  aiSource: string; 
  folder: string; 
  attachments: Attachment[];
}

function NoteFlow({ note, onSave }: { note: NoteItem, onSave: (id: string, flowData: FlowData) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(note.flowData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(note.flowData?.edges || []);
  const [isDirty, setIsDirty] = useState(false);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge(params, eds));
    setIsDirty(true);
  }, [setEdges]);

  const addNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      position: { x: Math.random() * 150, y: Math.random() * 150 },
      data: { label: 'New Concept' },
    };
    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true);
  };

  const onNodeDoubleClick = (event: React.MouseEvent, node: any) => {
    const newLabel = window.prompt('Rename Concept:', node.data.label);
    if (newLabel !== null && newLabel.trim() !== '') {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, label: newLabel } };
          }
          return n;
        })
      );
      setIsDirty(true);
    }
  };

  return (
    <div className="w-full h-64 mb-4 border-4 border-brutal-border rounded-2xl overflow-hidden bg-white hard-shadow flex flex-col">
      <div className="bg-black text-white text-[10px] font-black uppercase px-2 py-1 font-mono flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={12}/> KeeperLLM Workflow Graph
        </div>
        <div className="flex gap-2">
          <button onClick={addNode} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] border border-brutal-border/20 flex items-center gap-1 transition-colors">
            <Plus size={10} /> Add Node
          </button>
          {isDirty && (
            <button 
              onClick={() => { onSave(note._id, { nodes, edges }); setIsDirty(false); }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-[9px] border border-brutal-border/20 transition-colors"
            >
              Save Layout
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 w-full relative z-0">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={(changes) => { onNodesChange(changes); setIsDirty(true); }}
          onEdgesChange={(changes) => { onEdgesChange(changes); setIsDirty(true); }}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView 
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#ccc" gap={16} />
          <Controls showInteractive={false} position="bottom-right" className="bg-white border-2 border-brutal-border rounded-lg overflow-hidden shadow-sm" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function UltraKeeperPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('General');
  
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<'text' | 'file'>('text');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchNotes = () => {
    api.get('/api/notes').then(({ data }) => setNotes(data.notes || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotes(); }, []);

  const createNote = async () => {
    if (!title.trim() || !content.trim()) return toast.error('Fill in both fields');
    try {
      await api.post('/api/notes', { title, content, folder });
      toast.success('Note saved!');
      setTitle(''); setContent(''); setFolder('General'); setShowForm(false);
      fetchNotes();
    } catch { toast.error('Failed to save note'); }
  };

  const deleteNote = async (id: string) => {
    try {
      await api.delete(`/api/notes/${id}`);
      toast.success('Note deleted');
      fetchNotes();
    } catch { toast.error('Failed to delete'); }
  };

  const generateChart = async (id: string) => {
    try {
      toast.loading('Generating chart...', { id: 'chart' });
      const { data } = await api.post(`/api/notes/${id}/generate-chart`);
      toast.dismiss('chart');
      if (data.chartType === 'none') {
        toast('No chartable data found in this note', { icon: 'ℹ️' });
      } else {
        toast.success(`${data.chartType} chart generated!`);
        fetchNotes();
      }
    } catch { toast.dismiss('chart'); toast.error('Chart generation failed'); }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      if (aiMode === 'text') {
        if (!aiPrompt.trim()) { setGenerating(false); return toast.error('Enter a prompt'); }
        await api.post('/api/notes/generate-llm', { prompt: aiPrompt });
      } else {
        if (!aiFile) { setGenerating(false); return toast.error('Please select a file'); }
        const formData = new FormData();
        formData.append('file', aiFile);
        await api.post('/api/notes/generate-ai-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success('AI Note & Diagram Generated!');
      setShowAiModal(false);
      setAiPrompt('');
      setAiFile(null);
      fetchNotes();
    } catch {
      toast.error('AI Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const downloadNote = (note: NoteItem) => {
    const text = `# ${note.title}\n\n${note.content}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareNote = (note: NoteItem) => {
    if (navigator.share) {
      navigator.share({ title: note.title, text: note.content }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
      toast.success('Copied to clipboard');
    }
  };

  const saveFlowLayout = async (id: string, flowData: FlowData) => {
    try {
      await api.patch(`/api/notes/${id}`, { flowData });
      toast.success('Workflow layout saved!');
    } catch {
      toast.error('Failed to save layout');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="pencil-loader w-48" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-black uppercase flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>
          <FileText className="text-blue-500" /> Ultra Keeper
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAiModal(true)} className="comic-btn px-4 py-2 text-white rounded-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', backgroundColor: '#c084fc' }}>
            <Brain size={16} /> Auto-Generate
          </button>
          <button onClick={() => setShowForm(!showForm)} className="comic-btn px-4 py-2 text-brutal-text rounded-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', backgroundColor: '#facc15' }}>
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border-4 hard-shadow" style={{ background: 'var(--s-card)', borderColor: 'var(--s-border)' }}>
          <div className="flex gap-4 mb-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" className="notebook-input w-2/3 text-lg font-bold" />
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder (e.g. Science)" className="notebook-input w-1/3 text-sm" />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your notes here..." rows={6}
            className="notebook-input w-full mb-3 resize-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c4b896 27px, #c4b896 28px)' }} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border-2 rounded-xl font-bold" style={{ borderColor: 'var(--s-border)' }}>Cancel</button>
            <button onClick={createNote} className="comic-btn px-6 py-2 bg-green-400 text-brutal-text rounded-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>Save Note</button>
          </div>
        </motion.div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-3xl border-4 border-brutal-border shadow-[8px_8px_0px_#C77DFF] max-w-lg w-full">
            <h2 className="text-2xl font-black mb-4 font-display flex items-center gap-2"><Brain className="text-purple-500"/> Ask Sensei AI</h2>
            <p className="text-sm text-gray-600 mb-6 font-body font-bold">Sensei will generate a comprehensive note and a visual ReactFlow diagram using LangGraph and HuggingFace intelligence.</p>
            
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl border-2 border-brutal-border">
              <button onClick={() => setAiMode('text')} className={`flex-1 py-2 font-bold font-display text-sm rounded-lg border-2 ${aiMode === 'text' ? 'bg-white border-brutal-border' : 'border-transparent text-gray-500'}`}>From Text</button>
              <button onClick={() => setAiMode('file')} className={`flex-1 py-2 font-bold font-display text-sm rounded-lg border-2 ${aiMode === 'file' ? 'bg-white border-brutal-border' : 'border-transparent text-gray-500'}`}>From PDF/File</button>
            </div>

            {aiMode === 'text' ? (
              <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Explain Quantum Computing..." className="notebook-input w-full mb-4" />
            ) : (
              <div className="border-2 border-dashed border-brutal-border rounded-xl p-6 text-center mb-4 bg-purple-50 hover:bg-purple-100 transition-colors relative cursor-pointer">
                <input type="file" onChange={(e) => setAiFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.txt,.md" />
                <UploadCloud className="mx-auto mb-2 text-purple-500" size={32} />
                <p className="font-bold font-display text-sm">{aiFile ? aiFile.name : 'Click or Drag PDF/File here'}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded-xl font-bold border-2 border-brutal-border bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={generateWithAI} disabled={generating} className="comic-btn px-6 py-2 text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50 font-display" style={{ backgroundColor: '#a855f7' }}>
                {generating ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={16} />}
                Generate AI Note
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-20 opacity-50"><FileText size={64} className="mx-auto mb-4" /><p className="text-xl font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>No notes found</p></div>
      ) : (
        <div className="columns-1 lg:columns-2 gap-6 space-y-6">
          {notes.map((note, i) => (
            <motion.div key={note._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-3xl border-4 sticky-card flex flex-col hard-shadow break-inside-avoid mb-6" style={{ background: note.isAiNote ? '#F3E8FF' : ['#FFFDE7', '#FFE4E1', '#E8F5E9', '#E3F2FD'][i % 4], borderColor: 'var(--s-border)' }}>
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {note.isAiNote && <span className="bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded border border-brutal-border uppercase flex items-center gap-1"><Brain size={10}/> AI Generated</span>}
                    <span className="bg-white text-brutal-text text-[10px] font-black px-2 py-0.5 rounded border border-brutal-border uppercase flex items-center gap-1"><Folder size={10}/> {note.folder || 'General'}</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--s-text)' }}>{note.title}</h3>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => shareNote(note)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors border-2 border-transparent hover:border-brutal-border bg-white" title="Share"><Share2 size={16} /></button>
                   <button onClick={() => downloadNote(note)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors border-2 border-transparent hover:border-brutal-border bg-white" title="Download"><Download size={16} /></button>
                   <button onClick={() => generateChart(note._id)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors border-2 border-transparent hover:border-brutal-border bg-white" title="Generate Chart"><BarChart3 size={16} className="text-blue-500" /></button>
                   <button onClick={() => deleteNote(note._id)} className="p-1.5 hover:bg-red-200 rounded-lg transition-colors border-2 border-transparent hover:border-brutal-border bg-white" title="Delete"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>

              <div className="bg-white/60/60 p-5 rounded-xl border-2 border-brutal-border/10 mb-4 max-h-[400px] overflow-y-auto hide-scrollbar">
                 {note.content.split('\n').map((line, lIdx) => {
                   const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>');
                   if (line.startsWith('# ')) return <h1 key={lIdx} className="text-2xl font-black mt-4 mb-2 border-b-2 border-brutal-border/10 pb-2" dangerouslySetInnerHTML={{ __html: html.substring(2) }} style={{ fontFamily: 'var(--font-display)' }} />;
                   if (line.startsWith('## ')) return <h2 key={lIdx} className="text-xl font-bold mt-3 mb-2" dangerouslySetInnerHTML={{ __html: html.substring(3) }} />;
                   if (line.startsWith('### ')) return <h3 key={lIdx} className="text-lg font-bold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: html.substring(4) }} />;
                   if (line.startsWith('- ')) return <li key={lIdx} className="ml-5 list-disc mb-1.5 text-sm" dangerouslySetInnerHTML={{ __html: html.substring(2) }} />;
                   if (line.trim() === '') return <div key={lIdx} className="h-2" />;
                   return <p key={lIdx} className="text-sm font-body mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
                 })}
              </div>
              
              {note.attachments && note.attachments.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {note.attachments.map((att, attIdx) => (
                    <a key={attIdx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white border-2 border-brutal-border text-xs font-bold px-2 py-1 rounded-lg hover:bg-gray-50">
                      <Paperclip size={12} /> {att.name}
                    </a>
                  ))}
                </div>
              )}

              {note.flowData && note.flowData.nodes && note.flowData.nodes.length > 0 && (
                <NoteFlow note={note} onSave={saveFlowLayout} />
              )}

              {note.hasChart && note.chartData && note.chartData.chartType && note.chartData.chartType !== 'none' && (
                <div className="w-full h-64 mb-4 border-4 border-brutal-border rounded-2xl p-4 bg-white hard-shadow flex flex-col">
                  <h4 className="font-bold text-center mb-2 font-display uppercase text-sm">{note.chartData.chartTitle || 'Data Visualization'}</h4>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      {note.chartData.chartType === 'bar' ? (
                        <BarChart data={note.chartData.chartConfig?.data || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontFamily: 'monospace', fontSize: 10}} />
                          <YAxis tick={{fontFamily: 'monospace', fontSize: 10}} />
                          <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: '2px solid black', fontWeight: 'bold'}} />
                          <Bar dataKey="value" radius={[4,4,0,0]}>
                            {(note.chartData.chartConfig?.data || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={(note.chartData.chartConfig?.colors || ['#3b82f6'])[index % (note.chartData.chartConfig?.colors?.length || 1)]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : note.chartData.chartType === 'pie' ? (
                        <PieChart>
                          <Pie data={note.chartData.chartConfig?.data || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                            {(note.chartData.chartConfig?.data || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={(note.chartData.chartConfig?.colors || ['#3b82f6'])[index % (note.chartData.chartConfig?.colors?.length || 1)]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '8px', border: '2px solid black', fontWeight: 'bold'}} />
                        </PieChart>
                      ) : (
                        <LineChart data={note.chartData.chartConfig?.data || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontFamily: 'monospace', fontSize: 10}} />
                          <YAxis tick={{fontFamily: 'monospace', fontSize: 10}} />
                          <RechartsTooltip contentStyle={{borderRadius: '8px', border: '2px solid black', fontWeight: 'bold'}} />
                          <Line type="monotone" dataKey="value" stroke={(note.chartData.chartConfig?.colors || ['#3b82f6'])[0]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto border-t-2 border-brutal-border/10 pt-2">
                <span className="text-[10px] font-black uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--s-muted)' }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1">
                    {note.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-mono">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
