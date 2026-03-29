import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import "../../assets/css/SecureVideoPlayer.css";

const HEARTBEAT_INTERVAL_MS = 10000; // every 10 seconds
const COMPLETION_THRESHOLD = 0.92;   // 92% watched = complete

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
  const [signedUrl, setSignedUrl] = useState(null);
  const [quality, setQuality] = useState("720p");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [watchPercent, setWatchPercent] = useState(0);

  // ── Fetch signed URL from backend ──
  const fetchSignedUrl = useCallback(async (selectedQuality = quality) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const res = await axios.get("/api/videos/signed-url", {
        params: { courseId, videoId, quality: selectedQuality },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSignedUrl(res.data.signedUrl);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load video";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId, videoId, quality, getToken]);

  useEffect(() => {
    fetchSignedUrl(quality);
  }, [videoId, quality]);

  // ── Initialise HLS.js when signed URL is ready ──
  useEffect(() => {
    if (!signedUrl || !videoRef.current) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // 1. Extract the CloudFront VIP Pass (Signature, Policy, Key-Pair-Id) from the URL
      const urlObj = new URL(signedUrl);
      const cloudFrontSignatureParams = urlObj.search; // Contains "?Policy=...&Signature=..."

      const hls = new Hls({
        // Disable saving to disk / cache abuse
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        
        // 2. THE INTERCEPTOR: Attach the VIP pass to every video chunk requested
        xhrSetup: (xhr, url) => {
          if (!url.includes("Signature=")) {
            // Cleanly append params whether the URL already has a '?' or not
            const appendParams = cloudFrontSignatureParams.startsWith('?') 
              ? cloudFrontSignatureParams.substring(1) 
              : cloudFrontSignatureParams;
            
            const separator = url.includes('?') ? '&' : '?';
            url = url + separator + appendParams;
          }
          xhr.open("GET", url, true);
        },
      });

      hls.loadSource(signedUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Don't autoplay — student clicks play
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Signed URL likely expired — refresh
            fetchSignedUrl(quality);
          } else {
            setError("Video playback error. Please refresh.");
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      videoRef.current.src = signedUrl;
    } else {
      setError("Your browser does not support video streaming.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [signedUrl]);

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
      // Silently fail — don't interrupt playback
    }
  }, [courseId, videoId, videoIndex, getToken]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const percent = (video.currentTime / video.duration) * 100;
      setWatchPercent(Math.round(percent));

      // Mark complete at threshold
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
        // Only send if meaningful progress since last heartbeat
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

  // ── Block right-click and keyboard download shortcuts ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const blockContextMenu = (e) => e.preventDefault();
    const blockKeys = (e) => {
      // Block Ctrl+S, Ctrl+U, F12
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
    fetchSignedUrl(q).then(() => {
      // Restore position after quality switch
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
      <button onClick={() => fetchSignedUrl(quality)}>Retry</button>
    </div>
  );

  return (
    <div className="svp-wrapper">
      {/* Title */}
      <div className="svp-title">
        {title}
        {completed && <span className="svp-badge">✅ Completed</span>}
      </div>

      {/* Video element — controlsList blocks native download button */}
      <video
        ref={videoRef}
        className="svp-video"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
      />

      {/* Progress bar */}
      <div className="svp-progress-wrap">
        <div className="svp-progress-bar" style={{ width: `${watchPercent}%` }} />
      </div>

      {/* Quality selector */}
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