// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import styles from './StudentConsole.module.scss';

const CELEBRATION_MESSAGES = [
  'Submitted!',
  'Nice work!',
  'You did it!',
  'All done!',
  "Ship it! 🚀",
  'Boom! 💥',
];

function pickMessage(): string {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
}

function fireCelebration() {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 10000,
    disableForReducedMotion: true,
  };

  // Burst from left
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: 0.15, y: 0.6 },
    colors: ['#198665', '#C4704B', '#4E78FF', '#E8B931', '#D94F4F'],
  });

  // Burst from right
  confetti({
    ...defaults,
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 0.85, y: 0.6 },
    colors: ['#198665', '#C4704B', '#4E78FF', '#E8B931', '#D94F4F'],
  });

  // Center shower after a beat
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#198665', '#C4704B', '#4E78FF', '#E8B931'],
      scalar: 1.2,
    });
  }, 200);
}

interface SubmissionCelebrationProps {
  /** Set to true to trigger the celebration. Resets automatically. */
  trigger: boolean;
  onComplete?: () => void;
}

const SubmissionCelebration: React.FC<SubmissionCelebrationProps> = ({ trigger, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (trigger) {
      setMsg(pickMessage());
      setVisible(true);
      fireCelebration();

      timerRef.current = setTimeout(dismiss, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.celebrationOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
        >
          <motion.div
            className={styles.celebrationCard}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.celebrationEmoji}>🎉</div>
            <h2 className={styles.celebrationMessage}>{msg}</h2>
            <p className={styles.celebrationSubtext}>Your submission has been received.</p>
            <button className={styles.celebrationDismiss} onClick={dismiss}>
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionCelebration;
