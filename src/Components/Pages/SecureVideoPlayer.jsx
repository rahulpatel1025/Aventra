import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "../../assets/css/SecureVideoPlayer.css";

const COMPLETION_THRESHOLD = 95; // Marks complete at 95%

export default function SecureVideoPlayer({
  courseId,
  videoId,
  videoIndex,
  title,
  onComplete,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  // Anti-Cheat Refs
  const maxWatchedTime = useRef(0);
  const lastHeartbeatTime = useRef(0);

  const { getToken } = useAuth();
  const [videoUrl, setVideoUrl] = useState(null);
  const [quality, setQuality] = useState("720p");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [watchPercent, setWatchPercent] = useState(0);

  // ── 1. Fetch Signed Cookies & Clean URL from backend ──
  const fetchVideoAccess = useCallback(async (selectedQuality = quality) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const res = await axios.get("/api/videos/set-cookies", {
        params: { courseId, videoId, quality: selectedQuality },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
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
    // Reset state when video changes
    maxWatchedTime.current = 0;
    lastHeartbeatTime.current = 0;
    setCompleted(false);
    setWatchPercent(0);
    fetchVideoAccess(quality);
  }, [videoId, quality, fetchVideoAccess]);

  // ── 2. Initialise HLS.js using Cookies ──
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
        xhrSetup: (xhr) => {
          xhr.withCredentials = true; 
        },
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            fetchVideoAccess(quality); // Refresh cookies if expired
          } else {
            setError("Video playback error. Please refresh.");
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
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
  }, [videoUrl, fetchVideoAccess, quality]);

  // ── 3. Database Sync ──
  const sendHeartbeat = useCallback(async (percent, isComplete = false) => {
    try {
      const token = await getToken();
      const endpoint = isComplete ? "/api/progress/complete" : "/api/progress/heartbeat";
      await axios.post(
        endpoint,
        { 
          courseId, 
          videoId, 
          videoIndex, 
          watchPercent: percent, 
          watchedSeconds: Math.floor(maxWatchedTime.current) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Progress sync failed", err);
    }
  }, [courseId, videoId, videoIndex, getToken]);

  // ── 4. The Anti-Cheat Progress Tracker ──
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const current = video.currentTime;

    // 🛑 THE ANTI-CHEAT GATE: Rubber-band them back if they seek forward
    // (We allow a tiny 2-second buffer for browser buffering glitches)
    if (current > maxWatchedTime.current + 2) {
      video.currentTime = maxWatchedTime.current;
      return;
    }

    // Update their maximum watched time
    maxWatchedTime.current = Math.max(maxWatchedTime.current, current);
    const percent = Math.round((maxWatchedTime.current / video.duration) * 100);
    setWatchPercent(percent);

    // Heartbeat to DB every 10 seconds of actual playback
    if (current - lastHeartbeatTime.current > 10) {
      lastHeartbeatTime.current = current;
      sendHeartbeat(percent, false);
    }

    // Auto-complete when they reach the threshold
    if (!completed && percent >= COMPLETION_THRESHOLD) {
      setCompleted(true);
      sendHeartbeat(100, true);
      if (onComplete) onComplete(videoId, videoIndex);
    }
  };

  const handleEnded = () => {
    if (!completed && watchPercent >= COMPLETION_THRESHOLD) {
      setCompleted(true);
      sendHeartbeat(100, true);
      if (onComplete) onComplete(videoId, videoIndex);
    }
  };

  // ── 5. Block Right-Click ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const blockContextMenu = (e) => e.preventDefault();
    video.addEventListener("contextmenu", blockContextMenu);
    return () => video.removeEventListener("contextmenu", blockContextMenu);
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
        onTimeUpdate={handleTimeUpdate} // 👈 Tracking attached here
        onEnded={handleEnded}           // 👈 End handler
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