import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Sin permiso de portapapeles: el valor sigue visible para copiarlo a mano.
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copiado' : label}
    </Button>
  )
}
