let audioInstance: HTMLAudioElement | null = null;

/**
 * Play the timer expired sound notification
 * Sound plays once and does not loop
 */
export function playTimerExpiredSound(): void {
  try {
    // Reuse audio instance to prevent multiple overlapping sounds
    if (!audioInstance) {
      audioInstance = new Audio('/sounds/timer-expired.mp3');
      audioInstance.volume = 0.7; // 70% volume
    }
    
    // Reset and play
    audioInstance.currentTime = 0;
    audioInstance.play().catch((err) => {
      console.warn('Failed to play timer expired sound:', err);
      // Fallback: show visual indicator (already rendered)
    });
  } catch (error) {
    console.warn('Audio initialization failed:', error);
    // Fallback: visual indicator is still displayed
  }
}

/**
 * Stop the timer expired sound if playing
 */
export function stopTimerExpiredSound(): void {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
  }
}
