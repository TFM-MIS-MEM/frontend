import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import * as fr from '@/api/fr'
import type { Gallery, Identity, Page } from '@/api/types'
import { CopyButton } from '@/components/CopyButton'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Pager } from '@/components/Pager'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToken } from '@/core/auth'

const PAGE_SIZE = 20

// GET /v1/fr/commercial/galleries/{galleryId} (getGallery)
// GET /v1/fr/commercial/galleries/{galleryId}/identities (listIdentities)
export function GalleryDetail() {
  const token = useToken()
  const { galleryId = '' } = useParams()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [identities, setIdentities] = useState<Page<Identity> | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    fr.getGallery(token, galleryId)
      .then((g) => !cancelled && setGallery(g))
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [token, galleryId])

  useEffect(() => {
    let cancelled = false
    fr.listIdentities(token, galleryId, page, PAGE_SIZE)
      .then((p) => !cancelled && setIdentities(p))
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [token, galleryId, page])

  const fmt = (iso: string) => new Date(iso).toLocaleString('es-ES')

  return (
    <div className="grid gap-6">
      <Link to="/galleries" className="text-muted-foreground flex items-center gap-1 text-sm hover:underline">
        <ArrowLeft className="size-4" /> Galerías
      </Link>
      <ErrorAlert error={error} />
      {gallery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3">
              {gallery.name}
              <Badge variant={gallery.status === 'active' ? 'secondary' : 'destructive'}>{gallery.status}</Badge>
              <Badge variant="outline">modelo {gallery.model}</Badge>
            </CardTitle>
            {gallery.description && <CardDescription>{gallery.description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <span>
              id <code className="font-mono">{gallery.id}</code>
            </span>
            <CopyButton value={gallery.id} label="Copiar id" />
            <span className="text-muted-foreground">
              {gallery.identityCount} identidades · {gallery.faceCount} rostros
            </span>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Identidades</CardTitle>
          <CardDescription>Las da de alta el cliente por el canal de API; aquí se consultan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {identities && identities.items.length === 0 && (
            <p className="text-muted-foreground text-sm">Esta galería aún no tiene identidades.</p>
          )}
          {identities && identities.items.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Id externo</TableHead>
                    <TableHead className="text-right">Rostros</TableHead>
                    <TableHead>Alta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {identities.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.fullName}</TableCell>
                      <TableCell className="font-mono text-xs">{i.externalId ?? '—'}</TableCell>
                      <TableCell className="text-right">{i.faceCount}</TableCell>
                      <TableCell>{fmt(i.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager page={identities.page} pageSize={identities.pageSize} total={identities.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
