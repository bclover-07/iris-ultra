'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, Hand, Loader2, RotateCcw, Target, Trophy } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const COLORS = ['#FF3D00','#00E5FF','#D500F9','#00E676'];
const LABELS = ['A','B','C','D'];
const HOMES = [{x:0.12,y:0.22},{x:0.62,y:0.18},{x:0.08,y:0.52},{x:0.58,y:0.48}];
const GOAL = {x1:0.25,y1:0.72,x2:0.75,y2:0.92};
const inGoal = (x:number,y:number)=>x>GOAL.x1&&x<GOAL.x2&&y>GOAL.y1&&y<GOAL.y2;

export default function CamoQuizPage() {
  const [topic,setTopic]=useState('');
  const [quizState,setQuizState]=useState<'setup'|'loading'|'active'|'result'>('setup');
  const [quizId,setQuizId]=useState('');
  const [questions,setQuestions]=useState<any[]>([]);
  const [ci,setCi]=useState(0);
  const [score,setScore]=useState(0);
  const [ansState,setAnsState]=useState<'idle'|'validating'|'correct'|'wrong'>('idle');
  const [explanation,setExplanation]=useState('');
  const [grabbed,setGrabbed]=useState<number|null>(null);
  const [ptr,setPtr]=useState<{x:number,y:number}|null>(null);
  const [overGoal,setOverGoal]=useState(false);
  const [handOn,setHandOn]=useState(false);
  const [camReady,setCamReady]=useState(false);

  const cRef=useRef<HTMLDivElement>(null);
  const vRef=useRef<HTMLVideoElement>(null);
  const lmRef=useRef<any>(null);
  const wasPinch=useRef(false);
  const grabbedRef=useRef<number|null>(null);
  const ptrRef=useRef<{x:number,y:number}|null>(null);


  const ansStateRef=useRef(ansState); ansStateRef.current=ansState;
  const quizIdRef=useRef(quizId); quizIdRef.current=quizId;
  const questionsRef=useRef(questions); questionsRef.current=questions;
  const ciRef=useRef(ci); ciRef.current=ci;

  const selectOption=async(label:string)=>{
    if(ansStateRef.current!=='idle')return;
    setAnsState('validating');
    try{
      const qid=quizIdRef.current;
      const qs=questionsRef.current;
      const idx=ciRef.current;
      const{data}=await api.post('/api/quiz/camo/validate',{quizId:qid,questionId:qs[idx].id,gestureResult:label});
      setExplanation(data.explanation);
      if(data.correct){setAnsState('correct');setScore(s=>s+1);toast.success(`Correct! +${data.xpDelta} XP`);}
      else{setAnsState('wrong');toast.error(`Incorrect. Answer: ${data.correctAnswer}`);}
    }catch(e){toast.error('Validation failed');setAnsState('idle');}
  };
  const selectRef=useRef(selectOption); selectRef.current=selectOption;


  useEffect(()=>{
    (async()=>{
      try{
        const{FilesetResolver,HandLandmarker}=await import('@mediapipe/tasks-vision');
        const v=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        try {
          lmRef.current=await HandLandmarker.createFromOptions(v,{
            baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},
            runningMode:'VIDEO',numHands:1
          });
        } catch(gpuError) {
          console.warn('MediaPipe GPU failed, trying CPU fallback...', gpuError);
          lmRef.current=await HandLandmarker.createFromOptions(v,{
            baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},
            runningMode:'VIDEO',numHands:1
          });
        }
      }catch(e){console.warn('MediaPipe unavailable', e);}
    })();
  },[]);


  useEffect(()=>{
    if(quizState!=='active'||camReady)return;
    (async()=>{
      try{
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser camera API blocked. Please use localhost or HTTPS.');
        }
        const s=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'}});
        if(vRef.current){
          vRef.current.srcObject=s;
          vRef.current.onloadedmetadata = () => {
            vRef.current?.play().catch(e => console.warn('Play error:', e));
            setCamReady(true);
          };

          setTimeout(() => {
            if (vRef.current) vRef.current.play().catch(console.warn);
            setCamReady(true);
          }, 1500);
        } else {
          setCamReady(true); 
        }
      }catch(e: any){
        console.warn('Camera unavailable:', e);
        toast.error('Could not access camera: ' + e.message);
        setCamReady(true);
      }
    })();
  },[quizState, camReady]);


  useEffect(()=>{
    let af:number; let lt=-1;
    const loop=()=>{
      af=requestAnimationFrame(loop);
      if(!camReady||!lmRef.current||!vRef.current||!cRef.current)return;
      if(ansStateRef.current!=='idle')return;
      if(vRef.current.currentTime===lt)return;
      lt=vRef.current.currentTime;
      const res=lmRef.current.detectForVideo(vRef.current,performance.now());
      if(!res.landmarks?.length){setHandOn(false);return;}
      setHandOn(true);
      const idx8=res.landmarks[0][8],thb=res.landmarks[0][4];
      const rx=1-idx8.x,ry=idx8.y;
      const tx=1-thb.x,ty=thb.y;
      ptrRef.current={x:rx,y:ry};setPtr({x:rx,y:ry});
      const d=Math.hypot(rx-tx,ry-ty);
      const pinch=d<0.08;
      if(pinch&&!wasPinch.current){
        let best=-1,bd=Infinity;
        HOMES.forEach((h,i)=>{
          const p=grabbedRef.current===i?ptrRef.current:h;
          if(!p)return;
          const dd=Math.hypot(rx-p.x,ry-p.y);
          if(dd<0.15&&dd<bd){best=i;bd=dd;}
        });
        if(best!==-1){grabbedRef.current=best;setGrabbed(best);}
      }
      if(!pinch&&wasPinch.current&&grabbedRef.current!==null){
        if(inGoal(rx,ry))selectRef.current(LABELS[grabbedRef.current]);
        grabbedRef.current=null;setGrabbed(null);setOverGoal(false);
      }
      if(pinch&&grabbedRef.current!==null)setOverGoal(inGoal(rx,ry));
      wasPinch.current=pinch;
    };
    if(quizState==='active')loop();
    return()=>cancelAnimationFrame(af);
  },[quizState,camReady]);


  const m2r=(cx:number,cy:number)=>{
    if(!cRef.current)return{x:0,y:0};
    const r=cRef.current.getBoundingClientRect();
    return{x:(cx-r.left)/r.width,y:(cy-r.top)/r.height};
  };
  const onMD=(i:number)=>(e:React.MouseEvent)=>{
    if(ansStateRef.current!=='idle')return;e.preventDefault();
    grabbedRef.current=i;setGrabbed(i);
    const p=m2r(e.clientX,e.clientY);ptrRef.current=p;setPtr(p);
  };
  const onTD=(i:number)=>(e:React.TouchEvent)=>{
    if(ansStateRef.current!=='idle')return;
    const t=e.touches[0];grabbedRef.current=i;setGrabbed(i);
    const p=m2r(t.clientX,t.clientY);ptrRef.current=p;setPtr(p);
  };

  useEffect(()=>{
    const mm=(e:MouseEvent)=>{if(grabbedRef.current===null)return;const p=m2r(e.clientX,e.clientY);ptrRef.current=p;setPtr(p);setOverGoal(inGoal(p.x,p.y));};
    const mu=()=>{if(grabbedRef.current===null)return;const p=ptrRef.current;if(p&&inGoal(p.x,p.y))selectRef.current(LABELS[grabbedRef.current]);grabbedRef.current=null;setGrabbed(null);setOverGoal(false);};
    const tm=(e:TouchEvent)=>{if(grabbedRef.current===null)return;e.preventDefault();const t=e.touches[0];const p=m2r(t.clientX,t.clientY);ptrRef.current=p;setPtr(p);setOverGoal(inGoal(p.x,p.y));};
    const te=(e:TouchEvent)=>{if(grabbedRef.current===null)return;const t=e.changedTouches[0];const p=m2r(t.clientX,t.clientY);if(inGoal(p.x,p.y))selectRef.current(LABELS[grabbedRef.current]);grabbedRef.current=null;setGrabbed(null);setOverGoal(false);};
    window.addEventListener('mousemove',mm);window.addEventListener('mouseup',mu);
    window.addEventListener('touchmove',tm,{passive:false});window.addEventListener('touchend',te);
    return()=>{window.removeEventListener('mousemove',mm);window.removeEventListener('mouseup',mu);window.removeEventListener('touchmove',tm);window.removeEventListener('touchend',te);};
  },[]);

  const generateQuiz=async()=>{
    if(!topic)return toast.error('Enter a topic');
    setQuizState('loading');
    try{
      const{data}=await api.post('/api/quiz/generate',{mode:'camo',topic,difficulty:'intermediate'});
      setQuizId(data.quizId);setQuestions(data.questions);setCi(0);setScore(0);setAnsState('idle');
      setQuizState('active');
    }catch(e){toast.error('Failed to generate quiz');setQuizState('setup');}
  };

  const nextQ=()=>{
    setAnsState('idle');setExplanation('');setGrabbed(null);grabbedRef.current=null;setOverGoal(false);
    if(ci+1<questions.length)setCi(i=>i+1);
    else{setQuizState('result');if(vRef.current?.srcObject)(vRef.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop());}
  };


  if(quizState==='setup')return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'2rem',maxWidth:480,margin:'0 auto',padding:'0 1rem'}}>
      <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} style={{width:96,height:96,background:'linear-gradient(135deg,#D500F9,#651FFF)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(213,0,249,0.3),6px 6px 0 #111'}}>
        <Hand size={44} color="#fff"/>
      </motion.div>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontFamily:'var(--font-display)',color:'var(--s-text)',fontSize:'clamp(1.75rem,5vw,2.5rem)',fontWeight:900}}>CAMO QUIZ</h1>
        <p style={{color:'var(--s-muted)',marginTop:8,fontSize:'0.95rem'}}>Use hand gestures or drag & drop to answer</p>
      </div>
      <div style={{width:'100%',padding:'2rem',borderRadius:24,background:'var(--s-card)',border:'3px solid var(--s-border)',boxShadow:'6px 6px 0 var(--s-border)'}}>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generateQuiz()} placeholder="Enter topic (e.g. Javascript)" className="notebook-input w-full mb-5 text-lg text-center"/>
        <button onClick={generateQuiz} className="comic-btn w-full py-4 rounded-2xl text-lg font-bold flex justify-center items-center gap-2" style={{fontFamily:'var(--font-display)',background:'#FFD93D',color:'#111'}}>
          <Camera size={20}/> Generate Quiz
        </button>
      </div>
    </div>
  );


  if(quizState==='loading')return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1rem'}}>
      <Loader2 size={56} className="animate-spin" style={{color:'#D500F9'}}/>
      <h2 style={{fontFamily:'var(--font-display)',color:'var(--s-text)',fontSize:'1.5rem'}}>Generating Quiz...</h2>
    </div>
  );


  if(quizState==='result'){
    const pct=Math.round((score/questions.length)*100);
    return(
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1.5rem',textAlign:'center'}}>
        <Trophy size={64} style={{color:pct>=70?'#FFD93D':'#FF7A00'}}/>
        <h1 style={{fontFamily:'var(--font-display)',color:'var(--s-text)',fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900}}>Quiz Complete!</h1>
        <div style={{padding:'1.5rem 3rem',background:'var(--s-card)',border:'3px solid var(--s-border)',borderRadius:20,boxShadow:'6px 6px 0 var(--s-border)'}}>
          <p style={{fontFamily:'var(--font-display)',fontSize:'2.5rem',fontWeight:900,color:'var(--s-text)'}}>{score}/{questions.length}</p>
          <p style={{color:'var(--s-muted)',fontSize:'0.9rem',marginTop:4}}>{pct}% correct</p>
        </div>
        <button onClick={()=>{setQuizState('setup');setTopic('');setCi(0);setScore(0);setQuestions([]);setCamReady(false);}} className="comic-btn px-8 py-3 rounded-xl text-lg flex items-center gap-2" style={{fontFamily:'var(--font-display)',background:'#D500F9',color:'#fff'}}>
          <RotateCcw size={18}/> Play Again
        </button>
      </div>
    );
  }


  const q=questions[ci];if(!q)return null;
  const bSize='clamp(110px,22vw,170px)';

  return(
    <div ref={cRef} style={{position:'relative',width:'100%',height:'calc(100vh - 200px)',minHeight:350,borderRadius:20,overflow:'hidden',border:'3px solid var(--s-border)',boxShadow:'6px 6px 0 var(--s-border)',background:'#0a0a14',userSelect:'none',touchAction:'none'}}>

      {}
      <video ref={vRef} autoPlay playsInline muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',opacity:camReady?0.4:0,transition:'opacity 1s'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(10,10,20,0.4),rgba(10,10,20,0.2) 50%,rgba(10,10,20,0.5))',pointerEvents:'none'}}/>

      {}
      {[...Array(15)].map((_,i)=>(<div key={i} style={{position:'absolute',width:3+Math.random()*3,height:3+Math.random()*3,borderRadius:'50%',background:COLORS[i%4],opacity:0.2,left:`${10+Math.random()*80}%`,top:`${10+Math.random()*80}%`,animation:`float-slow ${4+Math.random()*4}s ease-in-out infinite`,animationDelay:`${i*0.3}s`,pointerEvents:'none'}}/>))}

      {}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:30,display:'flex',justifyContent:'center',padding:'clamp(8px,1.5vw,14px)'}}>
        <motion.div key={ci} initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'clamp(8px,1.5vw,14px) clamp(12px,2vw,24px)',maxWidth:650,textAlign:'center'}}>
          <p style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'rgba(255,255,255,0.4)',letterSpacing:'0.2em',marginBottom:4}}>QUESTION {ci+1} OF {questions.length}</p>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'clamp(0.75rem,1.8vw,1.15rem)',fontWeight:700,color:'#fff',lineHeight:1.4}}>{q.question}</h2>
        </motion.div>
      </div>

      {}
      <div style={{position:'absolute',top:8,right:10,zIndex:30,fontFamily:'var(--font-display)',fontSize:'0.75rem',fontWeight:900,background:'#FFD93D',color:'#111',padding:'3px 10px',borderRadius:8,border:'2px solid #111',boxShadow:'2px 2px 0 #111'}}>⚡{score}</div>

      {}
      {LABELS.map((label,i)=>{
        const isG=grabbed===i;
        const cx=isG&&ptr?`${ptr.x*100}%`:`${HOMES[i].x*100}%`;
        const cy=isG&&ptr?`${ptr.y*100}%`:`${HOMES[i].y*100}%`;
        return(
          <motion.div key={`${ci}-${label}`} initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.1,type:'spring',stiffness:200}}
            onMouseDown={onMD(i)} onTouchStart={onTD(i)}
            style={{
              position:'absolute',left:cx,top:cy,transform:'translate(-50%,-50%)',
              width:bSize,height:bSize,borderRadius:'50%',zIndex:isG?50:20,
              background:`radial-gradient(circle at 30% 25%,rgba(255,255,255,0.4),${COLORS[i]} 60%,${COLORS[i]}99)`,
              border:`3px solid ${COLORS[i]}`,
              boxShadow:isG?`0 0 50px ${COLORS[i]}90,0 0 100px ${COLORS[i]}50`:`0 0 25px ${COLORS[i]}50,inset 0 0 25px rgba(255,255,255,0.1)`,
              cursor:ansState==='idle'?'grab':'default',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              padding:'0.5rem',textAlign:'center',gap:2,
              transition:isG?'box-shadow 0.2s':'left 0.4s ease, top 0.4s ease, box-shadow 0.3s',
              animation:isG?'none':`camo-float-${i} ${5+i*0.8}s ease-in-out infinite`,
            }}>
            <span style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:'clamp(1rem,2.5vw,1.5rem)',color:'#fff',textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>{label}</span>
            <span style={{fontFamily:'var(--font-body)',fontSize:'clamp(0.55rem,1.1vw,0.72rem)',color:'rgba(255,255,255,0.9)',lineHeight:1.2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,textShadow:'0 1px 4px rgba(0,0,0,0.6)',maxWidth:'85%'}}>{q.options[i]}</span>
            <div style={{position:'absolute',top:'10%',left:'18%',width:'35%',height:'22%',borderRadius:'50%',background:'rgba(255,255,255,0.3)',filter:'blur(5px)',pointerEvents:'none'}}/>
          </motion.div>
        );
      })}

      {}
      <motion.div animate={{borderColor:overGoal?'#00E676':grabbed!==null?'#FFD93D':'rgba(255,255,255,0.15)',background:overGoal?'rgba(0,230,118,0.2)':grabbed!==null?'rgba(255,217,61,0.06)':'rgba(255,255,255,0.02)',scale:overGoal?1.06:1}}
        style={{position:'absolute',bottom:'3%',left:'50%',transform:'translateX(-50%)',width:'clamp(180px,44%,340px)',height:'clamp(55px,10%,80px)',border:'3px dashed',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',gap:8,zIndex:25,backdropFilter:'blur(8px)',transition:'all 0.2s'}}>
        <Target size={18} style={{color:overGoal?'#00E676':grabbed!==null?'#FFD93D':'rgba(255,255,255,0.25)',transition:'color 0.2s'}}/>
        <p style={{fontFamily:'var(--font-display)',fontSize:'clamp(0.6rem,1.2vw,0.8rem)',fontWeight:700,color:overGoal?'#00E676':grabbed!==null?'#FFD93D':'rgba(255,255,255,0.25)',letterSpacing:'0.15em',textTransform:'uppercase',transition:'color 0.2s'}}>
          {overGoal?'✨ Release to Submit!':grabbed!==null?'⬇ Drop Here':'🎯 Goal Zone'}
        </p>
      </motion.div>

      {}
      {handOn&&ptr&&ansState==='idle'&&(
        <div style={{position:'absolute',left:`${ptr.x*100}%`,top:`${ptr.y*100}%`,transform:'translate(-50%,-50%)',width:32,height:32,borderRadius:'50%',border:`3px solid ${wasPinch.current?'#00E676':'#FFD93D'}`,boxShadow:`0 0 20px ${wasPinch.current?'rgba(0,230,118,0.7)':'rgba(255,217,61,0.5)'}`,background:wasPinch.current?'rgba(0,230,118,0.2)':'transparent',zIndex:60,pointerEvents:'none',transition:'all 0.1s'}}/>
      )}

      {}
      <div style={{position:'absolute',bottom:6,left:10,zIndex:30,display:'flex',alignItems:'center',gap:5}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:handOn?'#00E676':camReady?'#FFD93D':'#555',boxShadow:handOn?'0 0 8px #00E676':'none'}}/>
        <span style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',color:'rgba(255,255,255,0.35)'}}>{handOn?'Hand tracked':camReady?'Show hand':'Waiting for camera...'}</span>
      </div>

      {}
      <AnimatePresence>
        {ansState!=='idle'&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={e=>e.target===e.currentTarget&&ansState!=='validating'&&nextQ()}
            style={{position:'absolute',inset:0,zIndex:70,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
            <motion.div initial={{scale:0.8}} animate={{scale:1}} style={{maxWidth:400,width:'100%',background:'#fff',border:'3px solid var(--s-border)',borderRadius:24,padding:'clamp(1.25rem,3vw,2rem)',textAlign:'center',boxShadow:'8px 8px 0 var(--s-border)',position:'relative',overflow:'hidden'}}>
              {ansState==='validating'?(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}><Loader2 size={40} className="animate-spin" style={{color:'#D500F9'}}/><p style={{fontFamily:'var(--font-display)',color:'var(--s-text)'}}>Checking...</p></div>):(
                <>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:ansState==='correct'?'#00E676':'#FF3D00'}}/>
                  <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>{ansState==='correct'?'🎯':'❌'}</div>
                  <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:900,color:ansState==='correct'?'#00C853':'#FF3D00',marginBottom:'0.5rem'}}>{ansState==='correct'?'Correct!':'Incorrect'}</h3>
                  <p style={{fontFamily:'var(--font-body)',fontSize:'0.85rem',color:'var(--s-muted)',lineHeight:1.6,marginBottom:'1.25rem',maxHeight:100,overflow:'auto'}}>{explanation}</p>
                  <button onClick={nextQ} className="comic-btn px-6 py-2.5 rounded-xl flex items-center gap-2 mx-auto" style={{fontFamily:'var(--font-display)',fontWeight:700,background:ansState==='correct'?'#00E676':'#FF7A00',color:'#111'}}>{ci+1<questions.length?'Next':'Results'} <ChevronRight size={16}/></button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes camo-float-0{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-14px) rotate(2deg)}}
        @keyframes camo-float-1{0%,100%{transform:translate(-50%,-50%) translateY(0)}33%{transform:translate(-50%,-50%) translateY(-18px) rotate(-1.5deg)}66%{transform:translate(-50%,-50%) translateY(-6px) rotate(1deg)}}
        @keyframes camo-float-2{0%,100%{transform:translate(-50%,-50%) translateY(0)}40%{transform:translate(-50%,-50%) translateY(-10px) rotate(1.5deg)}80%{transform:translate(-50%,-50%) translateY(-20px) rotate(-1deg)}}
        @keyframes camo-float-3{0%,100%{transform:translate(-50%,-50%) translateY(0)}25%{transform:translate(-50%,-50%) translateY(-16px) rotate(-2deg)}75%{transform:translate(-50%,-50%) translateY(-8px) rotate(1.5deg)}}
      `}</style>
    </div>
  );
}
