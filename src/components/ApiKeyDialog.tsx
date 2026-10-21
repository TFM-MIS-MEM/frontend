import { KeyRound } from 'lucide-react'

import { CopyButton } from '@/components/CopyButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// La API KEY se ve UNA vez: `auth` solo guarda su hash. El valor vive en el
// estado del componente que abre el diálogo y se descarta al cerrarlo; no se
// escribe en ningún almacenamiento del navegador.
export function ApiKeyDialog({ apiKey, onClose }: { apiKey: string | null; onClose: () => void }) {
  return (
    <Dialog open={apiKey !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" /> Tu API KEY
          </DialogTitle>
          <DialogDescription>
            Guárdala ahora: <strong>no se volverá a mostrar</strong>. Es la credencial del canal de API y va en la
            cabecera <code>X-API-Key</code> de tu backend, nunca en un navegador. Si la pierdes, rótala.
          </DialogDescription>
        </DialogHeader>
        <pre data-testid="api-key" className="bg-muted overflow-x-auto rounded-md p-3 font-mono text-sm break-all whitespace-pre-wrap">
          {apiKey}
        </pre>
        <DialogFooter>
          {apiKey && <CopyButton value={apiKey} />}
          <Button onClick={onClose}>La he guardado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
