'use client';

import { useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export default function MediaPipeDebateAnalyzer({ onMetricsUpdate }: { onMetricsUpdate: (metrics: any) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    let faceLandmarker: any;

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const analyze = async () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.currentTime > 0) {
            const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());
            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
              const blendshapes = results.faceBlendshapes[0].categories;
              

              const browDownL = blendshapes.find((b:any) => b.categoryName === 'browDownLeft')?.score || 0;
              const browDownR = blendshapes.find((b:any) => b.categoryName === 'browDownRight')?.score || 0;
              const jawOpen = blendshapes.find((b:any) => b.categoryName === 'jawOpen')?.score || 0;

              const frustration = Math.min(1, (browDownL + browDownR) * 1.5);
              const confidence = Math.max(0, 1 - (browDownL + browDownR));
              const aggression = Math.min(1, (browDownL + browDownR + jawOpen) / 2);

              onMetricsUpdate({
                frustrationScore: frustration,
                confidenceScore: confidence,
                aggressionScore: aggression,
                expressionState: frustration > 0.5 ? 'frustrated' : 'neutral'
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

    const currentVideo = videoRef.current;
    return () => {
      active = false;
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMetricsUpdate]);


  return <video ref={videoRef} className="hidden" muted playsInline />;
}
