// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Typography } from 'antd';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';

const CELEBRATION_MESSAGES = ['Submitted!', 'Nice work!', 'You did it!', 'All done!', 'Ship it! 🚀', 'Boom! 💥'];

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '48px 40px 32px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              maxWidth: 360,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <Typography.Title level={3} style={{ margin: '0 0 8px' }}>
              {msg}
            </Typography.Title>
            <Typography.Text type="secondary">Your submission has been received.</Typography.Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={dismiss}>
                Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionCelebration;
