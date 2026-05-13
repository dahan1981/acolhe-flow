interface AthenaMarkProps {
  className?: string;
}

export function AthenaMark({ className }: AthenaMarkProps) {
  return <img src="/athena-logo.jpg" alt="Athena Logo" aria-hidden="true" className={className} draggable={false} />;
}
