import { useEffect, useRef } from 'react';

export function MouseFollower() {
  // Use refs for direct DOM manipulation (High Performance)
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide default cursor on body if needed, but usually better to keep text cursor
    // document.body.style.cursor = 'none'; 

    const moveCursor = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }
      
      // Trailer with slight delay effect
      if (trailerRef.current) {
         // Using animate for smooth trailing without heavy JS math loop
         trailerRef.current.animate({
             transform: `translate3d(${clientX - 10}px, ${clientY - 10}px, 0)`
         }, {
             duration: 500,
             fill: 'forwards'
         });
      }
    };

    window.addEventListener('mousemove', moveCursor);

    // Hover effects logic
    const handleMouseOver = (e: MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
            trailerRef.current?.classList.add('scale-[3]', 'opacity-30', 'bg-pink-500');
            trailerRef.current?.classList.remove('border-pink-500', 'border-2');
        } else {
            trailerRef.current?.classList.remove('scale-[3]', 'opacity-30', 'bg-pink-500');
            trailerRef.current?.classList.add('border-pink-500', 'border-2');
        }
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Only render on desktop to save mobile performance
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return null;
  }

  return (
    <>
      {/* Main Dot */}
      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 bg-pink-500 rounded-full pointer-events-none z-[100] mix-blend-exclusion"
        style={{ willChange: 'transform' }}
      />
      {/* Trailer Ring */}
      <div
        ref={trailerRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[99] border-2 border-pink-500 transition-all duration-300 ease-out box-border"
        style={{ willChange: 'transform' }}
      />
    </>
  );
}

export default MouseFollower;
