import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "../../assets/css/SecureVideoPlayer.css";

const HEARTBEAT_INTERVAL_MS = 10000; 
const COMPLETION_THRESHOLD = 0.92;   

export default function SecureVideoPlayer({
  courseId,
  videoId,
  videoIndex,
  title,
  onComplete,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastHeartbeatPercent = useRef(0);

  const { getToken } = useAuth();
  const [videoUrl, setVideoUrl] = useState(null);
  const [quality, setQuality] = useState("720p");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [watchPercent, setWatchPercent] = useState(0);

  // ── Fetch Signed Cookies & Clean URL from backend ──
  const fetchVideoAccess = useCallback(async (selectedQuality = quality) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      // We hit the new endpoint. The backend sets the cookies automatically via headers!
      const res = await axios.get("/api/videos/set-cookies", {
        params: { courseId, videoId, quality: selectedQuality },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true // Crucial: Allows the backend to set cookies on the browser
      });
      
      setVideoUrl(res.data.videoUrl);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load video access";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId, videoId, quality, getToken]);

  useEffect(() => {
    fetchVideoAccess(quality);
  }, [videoId, quality]);

  // ── Initialise HLS.js using Cookies ──
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        
        // THE MAGIC TRICK: This forces HLS to send your CloudFront cookies with every request
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = true; 
        },
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Cookies likely expired — refresh them
            fetchVideoAccess(quality);
          } else {
            setError("Video playback error. Please refresh.");
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      videoRef.current.src = videoUrl;
    } else {
      setError("Your browser does not support video streaming.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // ── Heartbeat + completion tracking ──
  const sendHeartbeat = useCallback(async (percent, isComplete = false) => {
    try {
      const token = await getToken();
      const video = videoRef.current;
      const watchedSeconds = video ? Math.floor(video.currentTime) : 0;

      const endpoint = isComplete ? "/api/progress/complete" : "/api/progress/heartbeat";
      await axios.post(
        endpoint,
        { courseId, videoId, videoIndex, watchPercent: percent, watchedSeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Silently fail
    }
  }, [courseId, videoId, videoIndex, getToken]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const percent = (video.currentTime / video.duration) * 100;
      setWatchPercent(Math.round(percent));

      if (!completed && percent >= COMPLETION_THRESHOLD * 100) {
        setCompleted(true);
        sendHeartbeat(100, true);
        if (onComplete) onComplete(videoId, videoIndex);
        clearInterval(heartbeatRef.current);
      }
    };

    const handlePlay = () => {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(async () => {
        if (!video.duration) return;
        const percent = (video.currentTime / video.duration) * 100;
        if (Math.abs(percent - lastHeartbeatPercent.current) >= 2) {
          lastHeartbeatPercent.current = percent;
          await sendHeartbeat(Math.round(percent));
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    const handlePause = () => clearInterval(heartbeatRef.current);
    const handleEnded = () => {
      clearInterval(heartbeatRef.current);
      if (!completed) {
        setCompleted(true);
        sendHeartbeat(100, true);
        if (onComplete) onComplete(videoId, videoIndex);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      clearInterval(heartbeatRef.current);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [completed, sendHeartbeat, videoId, videoIndex, onComplete]);

  // ── Block right-click and keyboard shortcuts ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const blockContextMenu = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if ((e.ctrlKey && (e.key === "s" || e.key === "u")) || e.key === "F12") {
        e.preventDefault();
      }
    };

    video.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      video.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  const handleQualityChange = (q) => {
    const currentTime = videoRef.current?.currentTime || 0;
    setQuality(q);
    fetchVideoAccess(q).then(() => {
      setTimeout(() => {
        if (videoRef.current) videoRef.current.currentTime = currentTime;
      }, 800);
    });
  };

  if (loading) return (
    <div className="svp-loading">
      <div className="svp-spinner" />
      <span>Loading video...</span>
    </div>
  );

  if (error) return (
    <div className="svp-error">
      <span>⚠️ {error}</span>
      <button onClick={() => fetchVideoAccess(quality)}>Retry</button>
    </div>
  );

  return (
    <div className="svp-wrapper">
      <div className="svp-title">
        {title}
        {completed && <span className="svp-badge">✅ Completed</span>}
      </div>

      <video
        ref={videoRef}
        className="svp-video"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
      />

      <div className="svp-progress-wrap">
        <div className="svp-progress-bar" style={{ width: `${watchPercent}%` }} />
      </div>

      <div className="svp-controls">
        <span className="svp-quality-label">Quality:</span>
        {["360p", "720p", "1080p"].map((q) => (
          <button
            key={q}
            className={`svp-quality-btn ${quality === q ? "active" : ""}`}
            onClick={() => handleQualityChange(q)}
          >
            {q}
          </button>
        ))}
        <span className="svp-watch-pct">{watchPercent}% watched</span>
      </div>
    </div>
  );
}