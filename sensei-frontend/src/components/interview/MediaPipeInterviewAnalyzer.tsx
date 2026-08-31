'use client';

'use client';

import { useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export default function MediaPipeInterviewAnalyzer({ onMetricsUpdate }: { onMetricsUpdate: (metrics: any) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    let faceLandmarker: any;
    const currentVideo = videoRef.current;

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (currentVideo) {
          currentVideo.srcObject = stream;
          currentVideo.play();
        }

        const analyze = async () => {
          if (!active) return;
          if (currentVideo && currentVideo.currentTime > 0) {
            const results = faceLandmarker.detectForVideo(currentVideo, performance.now());
            
            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
              const blendshapes = results.faceBlendshapes[0].categories;
              

              const eyeLookOutL = blendshapes.find((b:any) => b.categoryName === 'eyeLookOutLeft')?.score || 0;
              const eyeLookOutR = blendshapes.find((b:any) => b.categoryName === 'eyeLookOutRight')?.score || 0;
              const eyeLookInL = blendshapes.find((b:any) => b.categoryName === 'eyeLookInLeft')?.score || 0;
              const eyeLookInR = blendshapes.find((b:any) => b.categoryName === 'eyeLookInRight')?.score || 0;
              const eyeLookUpL = blendshapes.find((b:any) => b.categoryName === 'eyeLookUpLeft')?.score || 0;
              const eyeLookUpR = blendshapes.find((b:any) => b.categoryName === 'eyeLookUpRight')?.score || 0;
              const eyeLookDownL = blendshapes.find((b:any) => b.categoryName === 'eyeLookDownLeft')?.score || 0;
              const eyeLookDownR = blendshapes.find((b:any) => b.categoryName === 'eyeLookDownRight')?.score || 0;


              const distracted = (eyeLookOutL + eyeLookOutR + eyeLookInL + eyeLookInR + eyeLookUpL + eyeLookUpR + eyeLookDownL + eyeLookDownR) / 4;
              const eyeContact = Math.max(0.1, 1 - distracted);


              const headTilt = results.facialTransformationMatrixes?.[0]?.data[1] || 0;
              const posture = Math.max(0.2, 1 - Math.abs(headTilt) * 2);


              const browDownL = blendshapes.find((b:any) => b.categoryName === 'browDownLeft')?.score || 0;
              const browDownR = blendshapes.find((b:any) => b.categoryName === 'browDownRight')?.score || 0;
              const mouthSmileL = blendshapes.find((b:any) => b.categoryName === 'mouthSmileLeft')?.score || 0;
              const mouthSmileR = blendshapes.find((b:any) => b.categoryName === 'mouthSmileRight')?.score || 0;

              const confidence = Math.max(0.1, 0.7 + (mouthSmileL + mouthSmileR) * 0.3 - (browDownL + browDownR));

              onMetricsUpdate({
                eyeContactScore: eyeContact,
                postureScore: posture,
                confidenceScore: confidence,
                expressionState: confidence > 0.6 ? 'confident' : (browDownL + browDownR) > 0.4 ? 'stressed' : 'neutral'
              });
            }
          }
          requestAnimationFrame(analyze);
        };
        analyze();

      } catch (err) {
        console.error("MediaPipe Init Error:", err);
      }
    }

    initMediaPipe();

    return () => {
      active = false;
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [onMetricsUpdate]);

  return <video ref={videoRef} className="hidden" muted playsInline />;
}
