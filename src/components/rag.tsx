export function Rag({ rag }: { rag: string }) {
  const cls =
    rag === 'green' ? 'rag-green' : rag === 'amber' ? 'rag-amber' : 'rag-red'
  return <span className={`badge ${cls}`}>{rag.toUpperCase()}</span>
}

export function RagCircle({
  rag,
  size = 'default',
}: {
  rag: string
  size?: 'small' | 'default'
}) {
  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'red':
        return 'bg-red-500'
      case 'amber':
        return 'bg-amber-500'
      case 'green':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'

  return <div className={`${sizeClass} rounded-full ${getRagColor(rag)}`} />
}
