import { useEffect, useRef, useState } from "react";
import styles from "./BackgroundMusic.module.css";

const SRC = `${import.meta.env.BASE_URL}bgm/when-i-was-a-boy-by-tokyo-music-walker.mp3`;
const STORAGE_KEY = "bgm-muted";
const TARGET_VOLUME = 0.4;
const FADE_MS = 1000;

const INTERACTION_EVENTS: (keyof WindowEventMap)[] = [
  "click",
  "pointerdown",
  "mousemove",
  "wheel",
  "scroll",
  "keydown",
  "touchstart",
];

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = TARGET_VOLUME;
    audio.muted = true;
    audio.play().catch((err) => {
      console.warn("[bgm] muted autoplay blocked", err);
    });

    const userPrefersMuted = () => localStorage.getItem(STORAGE_KEY) === "true";

    const fadeIn = () => {
      const start = audio.volume;
      const startedAt = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - startedAt) / FADE_MS);
        audio.volume = start + (TARGET_VOLUME - start) * t;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const onInteract = () => {
      cleanup();
      audio.play().catch((err) => console.warn("[bgm] play failed", err));
      if (!userPrefersMuted()) {
        audio.muted = false;
        audio.volume = 0;
        fadeIn();
        setMuted(false);
      }
    };

    const cleanup = () =>
      INTERACTION_EVENTS.forEach((e) => window.removeEventListener(e, onInteract));

    INTERACTION_EVENTS.forEach((e) =>
      window.addEventListener(e, onInteract, { once: true, passive: true }),
    );

    return cleanup;
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    if (!next) {
      audio.play().catch((err) => console.warn("[bgm] play failed", err));
    }
    setMuted(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onError={(e) => console.warn("[bgm] audio error", e)}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        aria-label={muted ? "음악 켜기" : "음악 끄기"}
        title={muted ? "음악 켜기" : "음악 끄기"}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77S18.01 4.14 14 3.23z" />
          </svg>
        )}
      </button>
    </>
  );
}
