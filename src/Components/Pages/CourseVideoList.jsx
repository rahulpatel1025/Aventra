import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import SecureVideoPlayer from "./SecureVideoPlayer";
import "../../assets/css/courseVideoList.css";

export default function CourseVideoList({ courseId, courseName }) {
  const { getToken } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const fetchCatalogue = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(`/api/videos/catalogue/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.videos;
      setVideos(list);

      // Auto-open the first unlocked incomplete video
      const firstUnlocked = list.findIndex((v) => !v.isLocked && !v.completed);
      const firstIncomplete = firstUnlocked !== -1 ? firstUnlocked : list.findIndex((v) => !v.isLocked);
      setActiveIndex(firstIncomplete !== -1 ? firstIncomplete : 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId, getToken]);

  useEffect(() => {
    fetchCatalogue();
  }, [courseId]);

  // Called by SecureVideoPlayer when a video finishes
  const handleVideoComplete = useCallback((videoId, videoIndex) => {
    setVideos((prev) =>
      prev.map((v, i) => {
        if (v.videoId === videoId) return { ...v, completed: true, watchPercent: 100 };
        // Unlock the next video
        if (i === videoIndex + 1) return { ...v, isLocked: false };
        return v;
      })
    );
    // Auto-advance to next video after 2 seconds
    setTimeout(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next < videos.length ? next : prev;
      });
    }, 2000);
  }, [videos.length]);

  if (loading) return (
    <div className="cvl-loading">Loading course content...</div>
  );

  if (error) return (
    <div className="cvl-error">⚠️ {error}</div>
  );

  const activeVideo = activeIndex !== null ? videos[activeIndex] : null;
  const completedCount = videos.filter((v) => v.completed).length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <div className="cvl-wrapper">
      {/* Course header + overall progress */}
      <div className="cvl-header">
        <h2 className="cvl-course-name">{courseName}</h2>
        <div className="cvl-overall-progress">
          <span>{completedCount}/{videos.length} lessons complete</span>
          <div className="cvl-overall-bar-wrap">
            <div className="cvl-overall-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="cvl-pct">{progressPercent}%</span>
        </div>
      </div>

      <div className="cvl-layout">
        {/* Video player — left/top */}
        <div className="cvl-player-section">
          {activeVideo && !activeVideo.isLocked ? (
            <SecureVideoPlayer
              key={activeVideo.videoId}
              courseId={courseId}
              videoId={activeVideo.videoId}
              videoIndex={activeVideo.index}
              title={`${activeVideo.index + 1}. ${activeVideo.title}`}
              onComplete={handleVideoComplete}
            />
          ) : activeVideo?.isLocked ? (
            <div className="cvl-locked-player">
              <div className="cvl-lock-icon">🔒</div>
              <p>Complete the previous lesson to unlock this video</p>
            </div>
          ) : null}
        </div>

        {/* Video list — right/bottom */}
        <div className="cvl-list">
          <div className="cvl-list-header">Course Content</div>
          {videos.map((video, i) => (
            <button
              key={video.videoId}
              className={[
                "cvl-item",
                video.isLocked ? "cvl-item--locked" : "",
                video.completed ? "cvl-item--completed" : "",
                i === activeIndex ? "cvl-item--active" : "",
              ].join(" ")}
              onClick={() => {
                if (!video.isLocked) setActiveIndex(i);
              }}
              disabled={video.isLocked}
            >
              <span className="cvl-item-icon">
                {video.completed ? "✅" : video.isLocked ? "🔒" : "▶"}
              </span>
              <span className="cvl-item-body">
                <span className="cvl-item-title">
                  {i + 1}. {video.title}
                </span>
                {!video.isLocked && !video.completed && video.watchPercent > 0 && (
                  <span className="cvl-item-subtext">{video.watchPercent}% watched</span>
                )}
                {video.completed && (
                  <span className="cvl-item-subtext cvl-item-subtext--done">Completed</span>
                )}
                {video.isLocked && (
                  <span className="cvl-item-subtext">Locked</span>
                )}
              </span>
              {/* Mini progress bar for in-progress videos */}
              {!video.isLocked && !video.completed && video.watchPercent > 0 && (
                <div className="cvl-item-progress">
                  <div className="cvl-item-progress-fill" style={{ width: `${video.watchPercent}%` }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}