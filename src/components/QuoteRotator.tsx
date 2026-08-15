import React, { useEffect, useState } from 'react';

const NOSTALGIC_QUOTES = [
  { quote: 'some nights are meant to be quiet.', sub: 'headphones on. world off.' },
  { quote: 'Same song. Different city. Just stay a while.', sub: 'somewhere, someone is listening too.' },
  { quote: 'the cat gets it.', sub: 'you don’t have to go anywhere.' },
  { quote: 'this song found you.', sub: 'don’t skip this one.' },
  { quote: 'the world can wait until morning.', sub: 'one more song.' },
  { quote: 'you had to be there.', sub: 'no cap.' },
  { quote: 'still listening?', sub: 'just stay a while.' },
  { quote: 'quiet solitude without loneliness.', sub: 'FM 98.7 • late night frequency' },
];

export const QuoteRotator: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NOSTALGIC_QUOTES.length);
        setFadeState('in');
      }, 700);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  const current = NOSTALGIC_QUOTES[index];

  return (
    <div className="flex flex-col gap-1.5 pointer-events-none max-w-[280px] sm:max-w-xs transition-all duration-700 select-none">
      <div className="text-[10px] uppercase font-mono-code tracking-[0.3em] text-indigo-300/40">
        Perspective
      </div>
      <p
        className={`font-serif-italic text-lg sm:text-2xl leading-snug text-slate-100/90 transition-all duration-700 ${
          fadeState === 'in' ? 'opacity-90 blur-0 translate-y-0' : 'opacity-0 blur-sm translate-y-1'
        }`}
      >
        "{current.quote}"
      </p>
      <p
        className={`text-[10px] uppercase font-mono-code tracking-widest text-slate-400/50 mt-1 transition-all duration-700 ${
          fadeState === 'in' ? 'opacity-60' : 'opacity-0'
        }`}
      >
        {current.sub}
      </p>
    </div>
  );
};
