import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import * as fr from '@/api/fr'
import type { Gallery, ModelName, Page } from '@/api/types'
import { CopyButton } from '@/components/CopyButton'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Pager } from '@/components/Pager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToken } from '@/core/auth'

const PAGE_SIZE = 20

// GET /v1/fr/commercial/galleries (listGalleries)
// POST /v1/fr/commercial/galleries (createGallery)
export function Galleries() {
  const token = useToken()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page<Gallery> | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [reload, setReload] = useState(0)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState<'' | ModelName>('')
  const [created, setCreated] = useState<Gallery | null>(null)
  const [createError, setCreateError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fr.listGalleries(token, page, PAGE_SIZE)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoadError(null)
        }
      })
      .catch((e) => !cancelled && setLoadError(e))
    return () => {
      cancelled = true
    }
  }, [token, page, reload])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setCreateError(null)
    try {
      const g = await fr.createGallery(token, { name, description, model: model || undefined })
      setCreated(g)
      setName('')
      setDescription('')
      setModel('')
      setReload((n) => n + 1)
    } catch (err) {
      setCreateError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva galería</CardTitle>
          <CardDescription>El modelo es inmutable: los vectores de modelos distintos no son comparables.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Modelo</Label>
              <select
                id="model"
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                value={model}
                onChange={(e) => setModel(e.target.value as '' | ModelName)}
              >
                <option value="">Por defecto del plan</option>
                <option value="xs">xs</option>
                <option value="s">s</option>
                <option value="base">base</option>
              </select>
            </div>
            <Button type="submit" disabled={busy}>
              Crear
            </Button>
          </form>
          <div className="mt-4 grid gap-3">
            <ErrorAlert error={createError} />
            {created && (
              <div className="bg-muted flex flex-wrap items-center gap-3 rounded-md p-3 text-sm">
                <span>
                  Creada <strong>{created.name}</strong> · id <code className="font-mono">{created.id}</code>
                </span>
                <CopyButton value={created.id} label="Copiar id" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galerías</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ErrorAlert error={loadError} />
          {data && data.items.length === 0 && <p className="text-muted-foreground text-sm">Aún no hay galerías.</p>}
          {data && data.items.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Id</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Identidades</TableHead>
                    <TableHead className="text-right">Rostros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <Link className="font-medium underline-offset-4 hover:underline" to={`/galleries/${g.id}`}>
                          {g.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{g.id}</TableCell>
                      <TableCell>{g.model}</TableCell>
                      <TableCell>
                        <Badge variant={g.status === 'active' ? 'secondary' : 'destructive'}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{g.identityCount}</TableCell>
                      <TableCell className="text-right">{g.faceCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
