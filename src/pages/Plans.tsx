import { useEffect, useState } from 'react'
import { Check, ExternalLink, Minus } from 'lucide-react'
import type { AddOn, Pricing, UsageLimit } from 'pricing4ts'

import { loadPinnedPricing } from '@/api/sphere'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// La vista de planes se pinta SOLA desde la tarifa publicada en SPHERE: planes,
// precios, funcionalidades, límites y complementos salen del YAML, y nada de
// ello está escrito aquí. Las etiquetas de cada fila son las descripciones de
// la propia tarifa (su primera frase; la completa, al pasar el ratón).
export function Plans() {
  const [data, setData] = useState<{ pricing: Pricing; permanentUrl: string } | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    loadPinnedPricing()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <ErrorAlert error={error} />
  if (!data) return <p className="text-sm text-muted-foreground">Cargando la tarifa…</p>

  const { pricing, permanentUrl } = data
  const plans = Object.values(pricing.plans ?? {})
  const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: pricing.currency })
  const number = new Intl.NumberFormat('es-ES')

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Planes</CardTitle>
          <CardDescription>
            Tarifa {pricing.saasName}, versión {pricing.version}, publicada en SPHERE. Precios sin impuestos.{' '}
            <a className="inline-flex items-center gap-1 underline" href={permanentUrl} target="_blank" rel="noreferrer">
              Ver en SPHERE <ExternalLink className="size-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2" />
                {plans.map((p) => (
                  <TableHead key={p.name} className="align-top">
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-base text-foreground">{money.format(Number(p.price))}</div>
                    <div className="text-xs font-normal">{p.unit}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell />
                {plans.map((p) => (
                  <TableCell key={p.name} className="whitespace-normal align-top text-xs text-muted-foreground">
                    {p.description}
                  </TableCell>
                ))}
              </TableRow>
              <SectionRow label="Funcionalidades" span={plans.length + 1} />
              {Object.values(pricing.features).map((f) => (
                <TableRow key={f.name}>
                  <Label description={f.description} name={f.name} />
                  {plans.map((p) => (
                    <TableCell key={p.name}>
                      {(p.features[f.name]?.value ?? f.defaultValue) === true ? (
                        <Check aria-label="incluida" className="size-4" />
                      ) : (
                        <Minus aria-label="no incluida" className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <SectionRow label="Límites" span={plans.length + 1} />
              {Object.values(pricing.usageLimits ?? {}).map((l) => (
                <TableRow key={l.name}>
                  <Label description={l.description} name={l.name} detail={limitDetail(l)} />
                  {plans.map((p) => (
                    <TableCell key={p.name} className="tabular-nums">
                      {number.format(Number(p.usageLimits?.[l.name]?.value ?? l.defaultValue))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {Object.keys(pricing.addOns ?? {}).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.values(pricing.addOns ?? {}).map((a) => (
            <AddOnCard key={a.name} addOn={a} pricing={pricing} money={money} number={number} />
          ))}
        </div>
      )}
    </div>
  )
}

function firstSentence(text?: string) {
  if (!text) return ''
  const end = text.indexOf('. ')
  return end === -1 ? text : text.slice(0, end + 1)
}

function limitDetail(l: UsageLimit) {
  return l.period ? `${l.unit} · ${l.period.value} ${l.period.unit}` : `${l.unit} · ${l.type}`
}

function Label({ name, description, detail }: { name: string; description?: string; detail?: string }) {
  return (
    <TableCell className="whitespace-normal" title={description}>
      <div>{firstSentence(description) || name}</div>
      <div className="font-mono text-xs text-muted-foreground">
        {name}
        {detail && ` · ${detail}`}
      </div>
    </TableCell>
  )
}

function SectionRow({ label, span }: { label: string; span: number }) {
  return (
    <TableRow className="bg-muted/50 hover:bg-muted/50">
      <TableCell colSpan={span} className="font-medium">
        {label}
      </TableCell>
    </TableRow>
  )
}

function AddOnCard({
  addOn,
  pricing,
  money,
  number,
}: {
  addOn: AddOn
  pricing: Pricing
  money: Intl.NumberFormat
  number: Intl.NumberFormat
}) {
  const features = Object.entries(addOn.features ?? {}).filter(([, f]) => f.value === true)
  const extensions = Object.entries(addOn.usageLimitsExtensions ?? {})
  const quantity = addOn.subscriptionConstraints
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {addOn.name}
          {addOn.availableFor.map((p) => (
            <Badge key={p} variant="secondary">
              {p}
            </Badge>
          ))}
        </CardTitle>
        <CardDescription>{addOn.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div>
          <span className="font-semibold">{money.format(Number(addOn.price))}</span>{' '}
          <span className="text-muted-foreground">{addOn.unit}</span>
        </div>
        {quantity && (
          <div className="text-muted-foreground">
            Cantidad: de {quantity.minQuantity} a {quantity.maxQuantity}
          </div>
        )}
        {features.length > 0 && (
          <ul className="list-inside list-disc">
            {features.map(([name]) => (
              <li key={name}>{firstSentence(pricing.features[name]?.description) || name}</li>
            ))}
          </ul>
        )}
        {extensions.length > 0 && (
          <ul className="list-inside list-disc">
            {extensions.map(([name, l]) => (
              <li key={name}>
                +{number.format(Number(l.value))} · {firstSentence(pricing.usageLimits?.[name]?.description) || name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
