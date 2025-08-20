import React from 'react'
import { Head, Deferred, usePage, router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import axios from '@/lib/axios'

type FlowStep =
  | { key: 'reason' | 'timing'; title: string; type: 'single-select'; options: { value: string; label: string }[]; required?: boolean }
  | { key: 'details'; title: string; type: 'textarea'; placeholder?: string; required?: boolean }
  | { key: 'retention'; title: string; type: 'offer-select'; required?: boolean }
  | { key: 'confirm'; title: string; type: 'confirm'; required?: boolean }

type Offer =
  | { key: string; type: 'coupon'; label: string; coupon: string }
  | { key: string; type: 'downgrade'; label: string; price_lookup_key: string }

type PageProps = {
  subscriptionId: string
  flow: { title: string; steps: FlowStep[] }
  offers: Offer[]
  subscription?: unknown
}

export default function CancelFlowPage() {
  const { props } = usePage<PageProps>()
  const steps = props.flow.steps
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, any>>({ timing: 'period_end' })
  const [error, setError] = React.useState<string | null>(null)
  const step = steps[activeIdx]

  function onNext() {
    setError(null)
    if (step.required) {
      if (step.key === 'reason' && !answers.reason) return setError('Please select a reason')
      if (step.key === 'timing' && !answers.timing) return setError('Please select when to cancel')
      if (step.key === 'confirm' && !answers.timing) return setError('Missing required info')
    }
    if (activeIdx < steps.length - 1) setActiveIdx(activeIdx + 1)
  }

  function onBack() {
    setError(null)
    if (activeIdx > 0) setActiveIdx(activeIdx - 1)
  }

  async function saveAnswers() {
    await axios.post(route('client.subscriptions.cancel.answers', { subscription: props.subscriptionId }), { answers })
  }

  async function applyOffer(offer: Offer) {
    const res = await axios.post(route('client.subscriptions.cancel.offer', { subscription: props.subscriptionId }), { offer })
    if (res.data?.ok) {
      setAnswers((s) => ({ ...s, offer: offer.key }))
      router.reload({ only: ['subscription'] })
    }
  }

  async function confirmCancel() {
    const res = await axios.post(route('client.subscriptions.cancel.confirm', { subscription: props.subscriptionId }), {
      cancel_timing: answers.timing || 'period_end',
      answers,
    })
    if (res.data?.ok) {
      router.visit(route('client.billing-portal.show'))
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head title="Cancel subscription" />
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{props.flow.title}</CardTitle>
            <CardDescription>Subscription: {props.subscriptionId}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="text-lg font-medium">{step.title}</div>

            {/* Step content */}
            {step.type === 'single-select' && 'options' in step && (
              <div className="grid gap-2">
                {step.options.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={step.key}
                      value={opt.value}
                      checked={answers[step.key] === opt.value}
                      onChange={() => setAnswers((s) => ({ ...s, [step.key]: opt.value }))}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {step.type === 'textarea' && (
              <div className="grid gap-2">
                <Label htmlFor="details">Details</Label>
                <Input
                  id="details"
                  as-child={undefined as never}
                  value={answers.details || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswers((s) => ({ ...s, details: e.target.value }))}
                  placeholder={(step as any).placeholder || 'Share more context…'}
                />
              </div>
            )}

            {step.type === 'offer-select' && (
              <div className="grid gap-3">
                {props.offers.map((offer) => (
                  <div key={offer.key} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{offer.label}</div>
                      <div className="text-xs text-muted-foreground">{offer.type === 'coupon' ? 'Coupon' : 'Downgrade'}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAnswers((s) => ({ ...s, offer: offer.key }))}>
                        Select
                      </Button>
                      <Button size="sm" onClick={() => applyOffer(offer)}>Apply now</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step.key === 'confirm' && (
              <div className="grid gap-2">
                <div className="text-sm text-muted-foreground">Timing: {answers.timing}</div>
                <div className="text-sm text-muted-foreground">Reason: {answers.reason || '-'}</div>
                <div className="text-sm text-muted-foreground">Offer: {answers.offer || '-'}</div>
              </div>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onBack} disabled={activeIdx === 0}>Back</Button>
              {step.key !== 'confirm' ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveAnswers}>Save</Button>
                  <Button onClick={onNext}>Continue</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveAnswers}>Save</Button>
                  <Button variant="destructive" onClick={confirmCancel}>Confirm cancellation</Button>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              <details>
                <summary>debug</summary>
                <pre className="whitespace-pre-wrap">{JSON.stringify({ answers, subscriptionId: props.subscriptionId }, null, 2)}</pre>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


