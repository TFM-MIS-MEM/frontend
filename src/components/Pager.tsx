import { Button } from '@/components/ui/button'

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="text-muted-foreground flex items-center justify-end gap-3 text-sm">
      <span>
        Página {page} de {pages} · {total} en total
      </span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </Button>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Siguiente
      </Button>
    </div>
  )
}
