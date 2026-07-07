import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { uploadVideo, analyzePose, getCorrectHistory } from '@/api/correct';

const Icons = {
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  stop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  analyze: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  angle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
};

interface AnalyzeResult {
  score: number;
  feedback: string;
  details: { joint: string; angle: number; standard: number; diff: number }[];
}

interface HistoryItem {
  id: number;
  exerciseType: string;
  score: number;
  date: string;
}

const Correct = () => {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'idle' | 'camera' | 'recording' | 'preview'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState('深蹲');
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [capturedAngles, setCapturedAngles] = useState<any>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const [videoKey, setVideoKey] = useState(0);
  const cameraRef = useRef<any>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const poseRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedStreamRef = useRef<MediaStream | null>(null);

  const angles = result?.details || [
    { joint: '左膝角度', angle: 92, standard: 90, diff: 2 },
    { joint: '右膝角度', angle: 88, standard: 90, diff: -2 },
    { joint: '躯干倾斜', angle: 15, standard: 10, diff: 5 },
    { joint: '髋部角度', angle: 45, standard: 45, diff: 0 },
  ];

  useEffect(() => {
    getCorrectHistory().then(setHistory).catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recordedStreamRef.current) {
        recordedStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch (e) {}
      }
      if (poseRef.current) {
        try { poseRef.current.close(); } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, recordedVideoUrl]);

  const startCamera = useCallback(async () => {
    setError(null);
    setModelLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setVideoSrc(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      const Pose = (window as any).Pose;
      const Camera = (window as any).Camera;
      const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;

      if (!Pose || !Camera) {
        setError('MediaPipe 加载失败，请刷新重试');
        setModelLoading(false);
        setMode('idle');
        return;
      }

      const pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        if (results.poseLandmarks) {
          const connections = POSE_CONNECTIONS;
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          for (const [i, j] of connections) {
            const p1 = results.poseLandmarks[i];
            const p2 = results.poseLandmarks[j];
            if (p1 && p2) {
              ctx.beginPath();
              ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
              ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              ctx.stroke();
            }
          }
          ctx.fillStyle = '#FF0000';
          for (const lm of results.poseLandmarks) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
          const lm = results.poseLandmarks;
          if (lm.length > 0) {
            const calcAngle = (p1: any, p2: any, p3: any) => {
              const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
              const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
              const dot = v1.x * v2.x + v1.y * v2.y;
              const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
              const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
              if (mag1 === 0 || mag2 === 0) return 0;
              const angle = Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2))));
              return Math.round(angle * 180 / Math.PI);
            };
            const leftKnee = calcAngle(lm[23], lm[25], lm[27]);
            const rightKnee = calcAngle(lm[24], lm[26], lm[28]);
            const torso = calcAngle(lm[11], lm[23], { x: lm[11].x, y: lm[23].y + 0.1 });
            setCapturedAngles({ leftKnee, rightKnee, torso, hip: 45 });
          }
        }
        ctx.restore();
      });

      poseRef.current = pose;

      const camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      await camera.start();

      setModelLoading(false);
      setMode('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setError('无法启动摄像头，请确保已授予摄像头权限');
      setModelLoading(false);
      setMode('idle');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (e) {}
      cameraRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (recordedStreamRef.current) {
      recordedStreamRef.current.getTracks().forEach(track => track.stop());
      recordedStreamRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVideoSrc(null);
    setMode('idle');
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream) {
      setError('请先打开摄像头');
      return;
    }
    setError(null);
    videoChunksRef.current = [];
    setMode('recording');

    try {
      // 创建一个包含 canvas 绘制的录制流
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Canvas 未就绪');
        return;
      }

      // 创建 canvas 流
      const canvasStream = canvas.captureStream(30);
      
      // 合并音频和视频轨道（如果有音频）
      const combinedStream = new MediaStream();
      
      // 添加视频轨道
      canvasStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      recordedStreamRef.current = combinedStream;

      // 使用兼容的 MIME 类型
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });

        setRecordedVideoUrl(url);
        setRecordedFile(file);
        setMode('preview');

        // 停止录制流
        if (recordedStreamRef.current) {
          recordedStreamRef.current.getTracks().forEach(track => track.stop());
          recordedStreamRef.current = null;
        }

        setVideoSrc(url);
        setVideoKey(prev => prev + 1);

        // 显示录制的视频
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
          }
        }, 100);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);

      // 自动停止录制（60秒后）
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 60000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('无法开始录制');
      setMode('camera');
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }

      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch (e) {}
        cameraRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (recordedStreamRef.current) {
        recordedStreamRef.current.getTracks().forEach(track => track.stop());
        recordedStreamRef.current = null;
      }

      const url = URL.createObjectURL(file);
      setRecordedVideoUrl(url);
      setRecordedFile(file);
      setResult(null);
      setMode('preview');
      setVideoSrc(url);
      setVideoKey(prev => prev + 1);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!recordedFile) {
      setError('请先录制或上传视频');
      return;
    }
    setError(null);
    setUploading(true);
    setAnalyzing(true);
    try {
      const videoUrl = await uploadVideo(recordedFile);
      const data = await analyzePose({ videoUrl, exerciseType });
      setResult(data);
      const newHistory = await getCorrectHistory();
      setHistory(newHistory);
    } catch (error) {
      console.error('分析失败:', error);
      setError('分析服务暂时不可用，请稍后重试');
      setResult({
        score: 87,
        feedback: '分析服务暂时不可用，这是示例数据。请稍后重试。',
        details: [
          { joint: '左膝角度', angle: 92, standard: 90, diff: 2 },
          { joint: '右膝角度', angle: 88, standard: 90, diff: -2 },
          { joint: '躯干倾斜', angle: 15, standard: 10, diff: 5 },
          { joint: '髋部角度', angle: 45, standard: 45, diff: 0 },
        ],
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setError(null);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (e) {}
      cameraRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (recordedStreamRef.current) {
      recordedStreamRef.current.getTracks().forEach(track => track.stop());
      recordedStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRecordedVideoUrl(null);
    setRecordedFile(null);
    setResult(null);
    setVideoSrc(null);
    videoChunksRef.current = [];
    setCapturedAngles(null);
    setMode('idle');
    setVideoKey(prev => prev + 1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '动作标准';
    if (score >= 60) return '基本正确';
    return '需要改进';
  };

  const statusText = () => {
    if (error) return '错误';
    if (analyzing) return '分析中...';
    if (modelLoading) return '加载模型中...';
    if (mode === 'recording') return '录制中...';
    if (mode === 'camera') return '摄像头已就绪';
    if (mode === 'preview') return '录制完成';
    return '等待开始';
  };

  const statusColor = () => {
    if (error) return 'bg-red-400';
    if (analyzing) return 'bg-amber-400';
    if (modelLoading) return 'bg-amber-400 animate-pulse';
    if (mode === 'recording') return 'bg-red-400 animate-pulse';
    if (mode === 'camera' || mode === 'preview') return 'bg-emerald-400';
    return 'bg-slate-300';
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-7 space-y-7">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center justify-between pb-5 border-b border-slate-200/50">
        <div>
          <h1 className="text-xl font-light text-slate-800 tracking-tight">动作纠正</h1>
          <p className="text-sm text-slate-400 font-light mt-0.5">智能录制训练视频，AI 分析动作质量</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-light"
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
          >
            <option>深蹲</option>
            <option>卧推</option>
            <option>硬拉</option>
          </select>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-md px-4 py-1.5 text-sm font-light flex items-center gap-1.5">
                {Icons.history}
                历史记录
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <DialogHeader className="px-0 pt-0 pb-4">
                  <DialogTitle className="text-slate-800 text-base font-light tracking-wide">纠正历史</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-400 font-light text-center py-4">暂无纠正记录</p>
                  ) : (
                    history.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50/60 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{item.exerciseType}</p>
                          <p className="text-xs text-slate-400 font-light">{item.date}</p>
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>{item.score}分</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-slate-200">
            <video
              key={videoKey}
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              controls={mode === 'preview'}
              playsInline
              autoPlay={mode === 'camera' || mode === 'preview'}
              muted={mode !== 'preview'}
              style={{ display: mode === 'preview' ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              width={640}
              height={480}
              style={{ display: mode !== 'preview' ? 'block' : 'none' }}
            />
            {mode === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                <span className="text-5xl mb-3 opacity-30">{Icons.camera}</span>
                <p className="text-sm font-light">点击下方按钮启动摄像头</p>
                <p className="text-xs text-slate-300 font-light mt-1">录制 30-60 秒训练视频</p>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${statusColor()}`} />
              <span className="text-xs text-white/80 font-light">{statusText()}</span>
            </div>
            {mode === 'recording' && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-white/80 font-light">录制中</span>
              </div>
            )}
          </div>

          <div className="p-5 flex flex-wrap items-center gap-2 bg-white">
            {mode === 'idle' && (
              <Button
                className="bg-slate-700 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2"
                onClick={startCamera}
              >
                {Icons.camera}
                打开摄像头
              </Button>
            )}

            {mode === 'camera' && (
              <>
                <Button
                  className="bg-slate-700 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2"
                  onClick={startRecording}
                >
                  {Icons.play}
                  录制
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2 text-sm font-light"
                  onClick={stopCamera}
                >
                  关闭摄像头
                </Button>
                <div className="ml-auto">
                  <label className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 transition-colors font-light flex items-center gap-1.5">
                    {Icons.upload}
                    上传视频
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </>
            )}

            {mode === 'recording' && (
              <>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2"
                  onClick={stopRecording}
                >
                  {Icons.stop}
                  停止
                </Button>
                <span className="text-sm text-red-500 ml-2 animate-pulse">● 录制中...</span>
                <div className="ml-auto">
                  <label className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 transition-colors font-light flex items-center gap-1.5">
                    {Icons.upload}
                    上传视频
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </>
            )}

            {mode === 'preview' && (
              <>
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2 text-sm font-light"
                  onClick={handleReset}
                >
                  重新录制
                </Button>
                <Button
                  className="bg-slate-700 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2 ml-auto"
                  onClick={handleAnalyze}
                  disabled={uploading || analyzing}
                >
                  {uploading ? '上传中...' : analyzing ? '分析中...' : '开始分析'}
                  {!uploading && !analyzing && Icons.analyze}
                </Button>
                <div className="ml-auto">
                  <label className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 transition-colors font-light flex items-center gap-1.5">
                    {Icons.upload}
                    上传视频
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              {Icons.angle}
              <span className="text-xs text-slate-500 font-light uppercase tracking-wider">实时角度数据</span>
            </div>
            <div className="space-y-4">
              {angles.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-light">{item.joint}</span>
                    <span className="font-medium text-slate-700">{item.angle}°</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(item.angle / 1.2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-200/50">
              <p className="text-xs text-slate-500 font-light uppercase tracking-wider mb-2">当前动作</p>
              <div className="bg-white rounded-lg px-3 py-2 text-sm font-light text-slate-700 border border-slate-200/50">
                {exerciseType}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl">
          <CardContent className="p-6">
            <span className="text-xs text-slate-500 font-light uppercase tracking-wider">分析结果</span>
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#eab308' : '#ef4444'}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(result.score / 100) * 175.93} 175.93`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700">
                      {result.score}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{getScoreLabel(result.score)}</p>
                    <p className={`text-sm font-medium ${getScoreColor(result.score)}`}>{result.score}分</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200/50">
                  <p className="text-xs text-slate-500 font-light mb-1">改进建议</p>
                  <p className="text-sm text-slate-600 font-light">{result.feedback}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-8 text-slate-400">
                <p className="text-sm font-light">录制或上传视频后点击分析</p>
                <p className="text-xs font-light mt-1">AI 将分析你的动作姿态</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Correct;