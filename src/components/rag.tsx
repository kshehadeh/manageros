export function Rag({ rag }: { rag: string }) {
  const cls =
    rag === 'green' ? 'rag-green' : rag === 'amber' ? 'rag-amber' : 'rag-red'
  return <span className={`badge ${cls}`}>{rag.toUpperCase()}</span>
}
