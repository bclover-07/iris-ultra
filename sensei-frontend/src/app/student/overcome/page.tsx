'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, UploadCloud, CheckCircle2, Camera, Clock, Sparkles, Brain, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OvercomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadTask, setUploadTask] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [aiVerifying, setAiVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOvercome = () => {
    setLoading(true);
    api.get('/api/overcome')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load Overcome data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOvercome();
  }, []);

  const generatePath = async () => {
    setGenerating(true);
    toast.loading('Analyzing interventions with HuggingFace & Gemini...', { id: 'gen' });
    try {
      const { data: newPath } = await api.post('/api/overcome/generate');
      setData((prev: any) => ({ ...prev, overcome: newPath }));
      toast.success('Overcome Learning Path Generated!', { id: 'gen' });
    } catch {
      toast.error('Failed to generate path', { id: 'gen' });
    } finally {
      setGenerating(false);
    }
  };

  const verifyInternalTask = async (taskId: string) => {
    try {
      await api.post(`/api/overcome/task/${taskId}/verify-internal`);
      toast.success('Task automatically verified from platform data!');
      fetchOvercome();
    } catch {
      toast.error('Failed to verify task');
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !uploadTask) return toast.error('Please select a file or take a picture');
    setAiVerifying(true);
    

    setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append('file', proofFile);
        
        await api.post(`/api/overcome/task/${uploadTask._id}/proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        toast.success('Proof uploaded and verified by AI!');
        setUploadTask(null);
        setProofFile(null);
        fetchOvercome();
      } catch {
        toast.error('Failed to upload proof');
      } finally {
        setAiVerifying(false);
      }
    }, 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="pencil-loader w-48" /></div>;

  const hasActivePath = data?.overcome && data.overcome.isActive && data.overcome.tasks?.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      {}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-4xl font-black uppercase flex items-center gap-2 font-display text-[#111] dark:text-white">
          <Target className="text-red-500 w-10 h-10" /> Overcome
        </h1>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] font-bold text-sm flex items-center gap-2 text-[#111] dark:text-white">
          <Brain className="text-purple-500 dark:text-purple-400" /> AI-Powered Growth Path
        </div>
      </div>

      {!hasActivePath ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-[#FFFDE7] dark:bg-slate-800 p-8 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] text-center">
             <AlertTriangle size={64} className="mx-auto mb-4 text-yellow-500 dark:text-yellow-400" />
             <h2 className="text-3xl font-black font-display mb-4 text-[#111] dark:text-white">You have unresolved weaknesses!</h2>
             <p className="text-gray-700 dark:text-slate-300 font-body max-w-2xl mx-auto mb-6 text-lg">
               Our AI has analyzed your recent interventions and quiz performances. You have pending areas for improvement. Click below to generate a highly personalized LangGraph learning path to overcome these challenges.
             </p>
             <button 
                onClick={generatePath} 
                disabled={generating}
                className="comic-btn px-8 py-4 bg-red-500 text-white text-xl font-black rounded-2xl flex items-center gap-3 mx-auto disabled:opacity-50"
             >
                {generating ? <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full" /> : <Sparkles />}
                Generate Overcome Path
             </button>
          </div>

          {}
          {data?.interventions?.length > 0 && (
            <div>
              <h3 className="text-2xl font-black font-display mb-4 flex items-center gap-2 text-[#111] dark:text-white"><FileText /> Intervention History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.interventions.map((inv: any, i: number) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-[#111] dark:border-slate-700 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] relative">
                    <span className={`absolute top-4 right-4 text-[10px] font-black uppercase px-2 py-1 rounded border-2 border-[#111] dark:border-slate-600 ${inv.urgency === 'critical' ? 'bg-red-500 dark:bg-red-600 text-white' : inv.urgency === 'high' ? 'bg-orange-500 dark:bg-orange-600 text-white' : 'bg-yellow-400 dark:bg-slate-700 text-[#111] dark:text-yellow-400'}`}>
                      {inv.urgency}
                    </span>
                    <h4 className="font-bold text-lg pr-16 mb-2 text-[#111] dark:text-white">{inv.triggerType.replace('_', ' ').toUpperCase()}</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{inv.message}</p>
                    <div className="text-xs font-mono font-bold text-gray-400 dark:text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
           
           <div className="flex justify-end mb-4">
             <button 
                onClick={generatePath} 
                disabled={generating}
                className="bg-black dark:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-600 border-2 border-transparent dark:border-slate-600 disabled:opacity-50 text-sm transition-colors"
             >
                {generating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={16} />}
                Regenerate Path
             </button>
           </div>
           
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
               <TrendingUp size={300} />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
               <div className="space-y-6">
                 <div>
                   <h3 className="text-xl font-black font-display mb-2 uppercase text-red-500 dark:text-red-400">The Problem</h3>
                   <p className="text-gray-700 dark:text-slate-300 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-2 border-red-200 dark:border-red-800/50 font-body">{data.overcome.pastSummary}</p>
                 </div>
                 <div>
                   <h3 className="text-xl font-black font-display mb-2 uppercase text-green-500 dark:text-green-400">The Goal</h3>
                   <p className="text-gray-700 dark:text-slate-300 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800/50 font-body">{data.overcome.futureProjection}</p>
                 </div>
               </div>

               {}
               {data.overcome.chartData && data.overcome.chartData.length > 0 && (
                 <div className="bg-white dark:bg-slate-700 border-2 border-[#111] dark:border-slate-600 rounded-2xl p-4 flex flex-col h-64">
                   <h4 className="font-bold text-center font-display mb-2 text-[#111] dark:text-white">Improvement Trajectory</h4>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={data.overcome.chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" tick={{fontFamily: 'monospace', fontSize: 12}} />
                       <YAxis />
                       <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: '2px solid black', fontWeight: 'bold'}} />
                       <Bar dataKey="score" radius={[8,8,0,0]}>
                         {data.overcome.chartData.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#10B981'][index % 3]} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               )}
             </div>
           </div>

           {}
           {data.overcome.flowData && data.overcome.flowData.nodes?.length > 0 && (
             <div className="space-y-4">
               <h3 className="text-2xl font-black font-display flex items-center gap-2 text-[#111] dark:text-white"><Sparkles className="text-purple-500 dark:text-purple-400" /> LangGraph Strategy Flow</h3>
               <div className="h-64 w-full border-4 border-[#111] dark:border-slate-700 rounded-3xl bg-gray-50 dark:bg-slate-800 overflow-hidden shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b]">
                 <ReactFlow nodes={data.overcome.flowData.nodes} edges={data.overcome.flowData.edges} fitView proOptions={{ hideAttribution: true }}>
                   <Background color="#ccc" gap={16} />
                 </ReactFlow>
               </div>
             </div>
           )}

           {}
           <div className="space-y-4">
             <h3 className="text-2xl font-black font-display flex items-center gap-2 text-[#111] dark:text-white"><CheckCircle2 className="text-green-500 dark:text-green-400" /> Actionable Tasks</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {data.overcome.tasks.map((task: any) => (
                 <div key={task._id} className={`p-5 rounded-2xl border-4 border-[#111] dark:border-slate-700 transition-all ${task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 opacity-70' : 'bg-white dark:bg-slate-800 shadow-[4px_4px_0_#111] dark:shadow-[4px_4px_0_#1e293b] hover:-translate-y-1'}`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-black font-mono bg-black dark:bg-slate-700 text-white px-2 py-1 rounded text-xs border border-transparent dark:border-slate-600">DAY {task.day}</span>
                     <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border-2 border-[#111] dark:border-slate-600 ${task.type === 'internal' ? 'bg-blue-200 dark:bg-slate-700 dark:text-blue-400' : 'bg-orange-200 dark:bg-slate-700 dark:text-orange-400'}`}>
                       {task.type} Task
                     </span>
                   </div>
                   <h4 className="font-bold text-lg mb-2 font-display text-[#111] dark:text-white">{task.title}</h4>
                   <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 flex-1">{task.description}</p>
                   
                   <div className="mt-auto">
                     {task.status === 'completed' ? (
                       <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                         <CheckCircle2 size={16} /> Verified & Completed
                       </div>
                     ) : task.type === 'internal' ? (
                       <button onClick={() => verifyInternalTask(task._id)} className="w-full comic-btn py-2 bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                         <Brain size={16} /> Auto-Verify from Platform
                       </button>
                     ) : (
                       <button onClick={() => setUploadTask(task)} className="w-full comic-btn py-2 bg-orange-500 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                         <Camera size={16} /> Upload Proof (Camera/File)
                       </button>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>

        </motion.div>
      )}

      {}
      <AnimatePresence>
        {uploadTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-4 border-[#111] dark:border-slate-700 shadow-[8px_8px_0_#111] dark:shadow-[8px_8px_0_#1e293b] max-w-md w-full relative">
              <button onClick={() => {setUploadTask(null); setProofFile(null);}} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-[#111] dark:text-white"><X size={20} /></button>
              
              <h2 className="text-2xl font-black mb-2 font-display text-[#111] dark:text-white">Submit Proof</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">Upload a photo of your notebook or screen for: <strong className="text-[#111] dark:text-white">{uploadTask.title}</strong></p>

              <div className="border-2 border-dashed border-[#111] dark:border-slate-600 rounded-2xl p-8 text-center mb-6 bg-gray-50 dark:bg-slate-700 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
                {proofFile ? (
                  <div className="text-green-600 font-bold flex flex-col items-center">
                    <CheckCircle2 size={40} className="mb-2" />
                    {proofFile.name}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Camera size={40} className="mb-2 text-brutal-text" />
                    <span className="font-bold">Tap to open Camera or select File</span>
                  </div>
                )}
              </div>

              {aiVerifying ? (
                <div className="bg-purple-100 p-4 rounded-xl border-2 border-purple-300 text-center flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm font-bold text-purple-700 font-mono">MediaPipe & HuggingFace Analyzing Proof...</span>
                </div>
              ) : (
                <button 
                  onClick={handleUploadProof}
                  disabled={!proofFile}
                  className="w-full comic-btn py-3 bg-black text-white rounded-xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit & Verify
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
