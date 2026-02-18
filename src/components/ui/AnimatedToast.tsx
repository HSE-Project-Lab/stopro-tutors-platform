import React, { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  show?: boolean;
  className?: string;
};

export default function AnimatedToast({ children, show = true, className = '' }: Props) {
  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(show);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (show) {
      setRender(true);
      t = setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      t = setTimeout(() => setRender(false), 220);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [show]);

  if (!render) return null;
  return (
    <div
      className={`transform transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}
    >
      {children}
    </div>
  );
}
