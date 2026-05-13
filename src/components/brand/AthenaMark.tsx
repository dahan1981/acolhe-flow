interface AthenaMarkProps {
  className?: string;
}

export function AthenaMark({ className }: AthenaMarkProps) {
  return <img src="/athena-mark.svg" alt="" aria-hidden="true" className={className} draggable={false} />;
}
