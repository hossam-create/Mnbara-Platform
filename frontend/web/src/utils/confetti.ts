export function triggerConfetti() {
  const colors = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'absolute z-50 animate-confetti pointer-events-none rounded-full';
    
    // Random Properties
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100 + 'vw';
    const size = Math.random() * 0.8 + 0.4 + 'rem';
    const duration = Math.random() * 2 + 1 + 's';
    
    confetti.style.backgroundColor = bg;
    confetti.style.left = left;
    confetti.style.top = '-5vh';
    confetti.style.width = size;
    confetti.style.height = size;
    confetti.style.opacity = '0.8';
    
    // Animation
    confetti.style.transition = `top ${duration} ease-in, transform ${duration} linear, opacity ${duration} ease-out`;

    document.body.appendChild(confetti);

    // Trigger fall
    requestAnimationFrame(() => {
        confetti.style.top = '105vh';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = '0';
    });

    // Cleanup
    setTimeout(() => {
        confetti.remove();
    }, 3000);
  }
}
