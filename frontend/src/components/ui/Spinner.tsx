export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-herb ${className}`}
      role="status"
      aria-label="Carregando"
    />
  );
}
