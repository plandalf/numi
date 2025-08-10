import React from 'react'
import { usePage, Head, Deferred, router } from '@inertiajs/react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Download, Plus, Wallet, Receipt, Cog } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import axios from '@/lib/axios'

type SubscriptionData = {
  status: 'active' | 'trial' | 'canceled' | string
  plan: string
  price: string
  renewsOn: string
  trialEndsOn?: string | null
  id?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  canceledAt?: string | null
  collectionMethod?: string | null
  defaultPaymentMethod?: string | null
}

type PaymentMethod = { id: string; brand: string; last4: string; exp: string; isDefault: boolean }
type Invoice = { id: string; number: string; date: string; amount: string; status: 'paid' | 'open' | 'void' | 'uncollectible' | string; pdfUrl?: string | null; hostedUrl?: string | null }
type SubscriptionRow = {
  id: string
  status: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  plan: { name?: string | null; amount?: number | null; currency?: string | null; interval?: string | null }
}
type PaymentRow = { id: string; amount: string; status: string; paid: boolean; created?: string | null; description?: string | null; receiptUrl?: string | null }
type OrderRow = { id: string; number: number; status: string; total: string; createdAt?: string | null; receiptUrl?: string | null }

type BillingPortalProps = {
  customer?: {
    email?: string
    name?: string
    external_id?: string
  }
  customerId?: string
  subscription?: SubscriptionData
  paymentMethods?: PaymentMethod[]
  invoices?: Invoice[]
  payments?: PaymentRow[]
  subscriptions?: SubscriptionRow[]
  orders?: OrderRow[]
  returnUrl?: string
}

export default function BillingPortalPage() {
  const { props } = usePage<BillingPortalProps>()
  const customer = props.customer || {}

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head title="Billing Portal" />
      <div className="mx-auto w-full p-4 sm:p-6">

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-4" /> Subscription
                </CardTitle>
                <CardDescription>Your current plan and renewal details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Deferred
                  data="subscription"
                  fallback={(
                    <div className="grid gap-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-28" />
                      </div>
                    </div>
                  )}
                >
                  <SubscriptionDetails />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4" /> Payment methods
                </CardTitle>
                <CardDescription>Manage cards used for your subscription</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Deferred
                  data="paymentMethods"
                  fallback={(
                    <div className="grid gap-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <Skeleton className="h-5 w-24 mb-2" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                      ))}
                    </div>
                  )}
                >
                  <PaymentMethodsList />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="size-4" /> Invoices
                </CardTitle>
                <CardDescription>Your recent bills and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <Deferred
                  data="invoices"
                  fallback={(
                    <div className="grid gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-9 w-28" />
                        </div>
                      ))}
                    </div>
                  )}
                >
                  <InvoicesTable />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>All charges including failed ones</CardDescription>
              </CardHeader>
              <CardContent>
                <Deferred data="payments" fallback={<div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-10 rounded border" />))}</div>}>
                  <PaymentsTable />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Subscription history</CardTitle>
                <CardDescription>Past and current subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <Deferred data="subscriptions" fallback={<div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-10 rounded border" />))}</div>}>
                  <SubscriptionsTable />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Orders placed through Plandalf</CardDescription>
              </CardHeader>
              <CardContent>
                <Deferred data="orders" fallback={<div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-10 rounded border" />))}</div>}>
                  <OrdersTable />
                </Deferred>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="size-4" /> Manage subscription
                </CardTitle>
                <CardDescription>Update email used for invoices or cancel at period end</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Billing email</Label>
                    <Input id="email" defaultValue={customer.email || ''} placeholder="you@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" defaultValue={customer.name || ''} placeholder="Jane Doe" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline">Discard</Button>
                  <Button>Save changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {props.returnUrl && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                // If inside an iframe popup, attempt to close via postMessage
                const isFramed = window.self !== window.top
                if (isFramed && window.parent) {
                  try {
                    window.parent.postMessage({ type: 'numi-close-popup' }, '*')
                  } catch {
                    // ignore
                  }
                } else {
                  window.location.href = props.returnUrl as string
                }
              }}
            >
              Return to site
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function SubscriptionDetails() {
  const { props } = usePage<{ subscription?: SubscriptionData | null }>()
  const sub = props.subscription ?? null
  const [open, setOpen] = React.useState(false)
  if (!sub) {
    return (
      <div className="text-sm text-muted-foreground">
        No subscription found.
        <details className="mt-2 text-xs">
          <summary>debug</summary>
          <pre className="max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ subscription: sub }, null, 2)}</pre>
        </details>
      </div>
    )
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Plan</div>
          <div className="font-medium">{sub.plan}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Price</div>
          <div className="font-medium">{sub.price}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Renews on</div>
          <div className="font-medium">{sub.renewsOn}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Change plan</Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!sub.id}
            onClick={() => {
              if (!sub.id) return
              router.visit(route('client.subscriptions.cancel', { subscription: sub.id }))
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
        <Field label="Subscription ID" value={sub.id || '-'} />
        <Field label="Current period" value={sub.currentPeriodStart && sub.currentPeriodEnd ? `${sub.currentPeriodStart} → ${sub.currentPeriodEnd}` : '-'} />
        <Field label="Trial ends" value={sub.trialEndsOn || '-'} />
        <Field label="Cancel at period end" value={sub.cancelAtPeriodEnd ? 'Yes' : 'No'} />
        <Field label="Canceled at" value={sub.canceledAt || '-'} />
        <Field label="Collection method" value={sub.collectionMethod || '-'} />
        <Field label="Default payment method" value={sub.defaultPaymentMethod || '-'} />
      </div>

      <details className="mt-2 text-xs text-muted-foreground">
        <summary>debug</summary>
        <pre className="max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ subscription: sub }, null, 2)}</pre>
      </details>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change plan</DialogTitle>
            <DialogDescription>Select a new plan for your subscription</DialogDescription>
          </DialogHeader>
          <ChangePlan />
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function PaymentMethodsList() {
  const { props } = usePage<{ paymentMethods?: PaymentMethod[] | null; customerId?: string }>()
  const methods = props.paymentMethods ?? []
  const customerId = props.customerId

  const [isAdding, setIsAdding] = React.useState(false)
  const [setupClientSecret, setSetupClientSecret] = React.useState<string | null>(null)
  const [setupPublishableKey, setSetupPublishableKey] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function startAddPaymentMethod() {
    try {
      setIsAdding(true)
      setError(null)
      const res = await axios.post(route('client.billing.setup-intent'), { customer_id: customerId })
      const data: { client_secret?: string; publishable_key?: string; error?: string } = res.data
      if (res.status !== 200 || !data.client_secret || !data.publishable_key) {
        throw new Error(data.error || 'Failed to create setup intent')
      }
      setSetupClientSecret(data.client_secret)
      setSetupPublishableKey(data.publishable_key)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      setIsAdding(false)
    }
  }

  async function setDefault(paymentMethodId: string) {
    try {
      setError(null)
      const res = await axios.post(route('client.billing.default-payment-method'), {
        customer_id: customerId,
        payment_method_id: paymentMethodId,
      })
      const data: { ok?: boolean; error?: string } = res.data
      if (res.status !== 200 || !data.ok) throw new Error(data.error || 'Failed to set default payment method')
      // Optimistic UI: reload page props by visiting same route (keeps iframe)
      window.location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
    }
  }
  if (methods.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No payment methods found.
        <div className="mt-3">
          <Button size="sm" onClick={startAddPaymentMethod} disabled={isAdding || !customerId}>
            <Plus className="size-4" /> Add payment method
          </Button>
        </div>
        <details className="mt-2 text-xs">
          <summary>debug</summary>
          <pre className="max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ paymentMethods: props.paymentMethods ?? null }, null, 2)}</pre>
        </details>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    )
  }
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Update your default payment method</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={startAddPaymentMethod} disabled={isAdding || !customerId}>
            <Plus className="size-4" /> Add payment method
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        {methods.map((pm) => (
          <div key={pm.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {pm.brand}
              </div>
              <div className="font-medium">•••• {pm.last4}</div>
              <div className="text-sm text-muted-foreground">Exp {pm.exp}</div>
              {pm.isDefault && <Badge variant="secondary">Default</Badge>}
            </div>
            <div className="flex gap-2">
              {!pm.isDefault && (
                <Button size="sm" variant="outline" onClick={() => setDefault(pm.id)}>Make default</Button>
              )}
              <Button size="sm" variant="destructive">Remove</Button>
            </div>
          </div>
        ))}
      </div>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {isAdding && !setupClientSecret && (
        <div className="text-sm text-muted-foreground">Creating setup intent…</div>
      )}
      {setupClientSecret && setupPublishableKey && (
        <div className="mt-3">
          <AddCardForm clientSecret={setupClientSecret} publishableKey={setupPublishableKey} onCompleted={() => window.location.reload()} />
        </div>
      )}
    </>
  )
}

function AddCardForm({ clientSecret, publishableKey, onCompleted }: { clientSecret: string; publishableKey: string; onCompleted: () => void }) {
  const stripePromise = React.useMemo(() => loadStripe(publishableKey), [publishableKey])
  const options = React.useMemo(() => ({ clientSecret }), [clientSecret])
  return (
    <Elements stripe={stripePromise} options={options}>
      <AddCardFormInner onCompleted={onCompleted} />
    </Elements>
  )
}

function AddCardFormInner({ onCompleted }: { onCompleted: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSave() {
    try {
      if (!stripe || !elements) return
      setSaving(true)
      setError(null)
      const { error } = await stripe.confirmSetup({ elements, confirmParams: {}, redirect: 'if_required' })
      if (error) throw new Error(error.message || 'Failed to save payment method')
      onCompleted()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-3">
      <PaymentElement options={{ layout: 'accordion' }} />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save payment method'}</Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}

function InvoicesTable() {
  const { props } = usePage<{ invoices?: Invoice[] | null }>()
  const rows = props.invoices ?? []
  const [invoiceError, setInvoiceError] = React.useState<string | null>(null)

  async function retryPay(invId: string) {
    try {
      setInvoiceError(null)
      const res = await axios.post(route('client.billing.pay-invoice', { invoice: invId }))
      const data: { ok?: boolean; error?: string } = res.data
      if (res.status !== 200 || !data.ok) throw new Error(data.error || 'Failed to pay invoice')
      window.location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setInvoiceError(message)
    }
  }
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No invoices found.
        <details className="mt-2 text-xs">
          <summary>debug</summary>
          <pre className="max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ invoices: props.invoices ?? null }, null, 2)}</pre>
        </details>
      </div>
    )
  }
  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>#{inv.number}</TableCell>
            <TableCell>{inv.date}</TableCell>
            <TableCell>{inv.amount}</TableCell>
            <TableCell>
              <Badge variant={inv.status === 'paid' ? 'secondary' : 'outline'}>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Prefer direct URL from props (avoids extra hop)
                      if (inv.pdfUrl) {
                        window.open(inv.pdfUrl, '_blank')
                        return
                      }
                      if (inv.hostedUrl) {
                        window.open(inv.hostedUrl, '_blank')
                        return
                      }
                      const res = await axios.get(route('client.billing.invoice-url', { invoice: inv.id }))
                      const data: { ok?: boolean; url?: string; error?: string } = res.data
                      if (!res.status || !data.ok || !data.url) throw new Error(data.error || 'No URL available')
                      window.open(data.url, '_blank')
                    } catch {
                      // optionally show a toast/error; noop for now
                    }
                  }}
                >
                  <Download className="size-4" /> Download
                </Button>
                {inv.status !== 'paid' && (
                  <Button size="sm" variant="default" onClick={() => retryPay(inv.id)}>
                    Retry
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {invoiceError && <div className="text-red-600 mt-2 text-sm">{invoiceError}</div>}
    </>
  )
}

function PaymentsTable() {
  const { props } = usePage<{ payments?: PaymentRow[] | null }>()
  const rows = props.payments ?? []
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No payments found.</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.created || '-'}</TableCell>
            <TableCell>{p.amount}</TableCell>
            <TableCell>
              <Badge variant={p.paid ? 'secondary' : 'outline'}>{p.status}</Badge>
            </TableCell>
            <TableCell className="max-w-[28ch] truncate" title={p.description || ''}>{p.description || '-'}</TableCell>
            <TableCell className="text-right">
              {p.receiptUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={p.receiptUrl} target="_blank" rel="noreferrer">View</a>
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ChangePlan() {
  const { props } = usePage<{ plans?: { key: string; name: string; display: string; lookup_key: string; gateway_price_id?: string | null; product?: string; amountMinor?: number; currency?: string; interval?: string; direction?: 'upgrade' | 'downgrade' | 'same' | null }[]; subscription?: SubscriptionData; customerId?: string }>()
  const plans = props.plans || []
  const sub = props.subscription
  const [selected, setSelected] = React.useState<string>('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  if (plans.length === 0) return null

  async function onSwap() {
    try {
      setSaving(true)
      setError(null)
      const res = await axios.post(route('client.billing.swap-plan'), {
        customer_id: props.customerId,
        price_key: selected,
        subscription_id: sub?.id || null,
      })
      if (res.status !== 200 || !res.data?.ok) throw new Error(res.data?.error || 'Failed to swap plan')
      router.reload({ only: ['subscription', 'subscriptions'] })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="text-sm font-medium">Change plan</div>
      <div className="grid gap-2">
        {plans.map((p) => (
          <label key={p.key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <input type="radio" name="plan" value={p.lookup_key} onChange={() => setSelected(p.lookup_key)} />
              <div>
                <div className="font-medium">{p.product || p.name}</div>
                <div className="text-xs text-muted-foreground">{p.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{p.display}</div>
              {p.direction && (
                <div className="mt-1 flex justify-end">
                  <Badge variant={p.direction === 'upgrade' ? 'default' : p.direction === 'downgrade' ? 'outline' : 'secondary'}>
                    {p.direction === 'upgrade' ? 'Upgrade' : p.direction === 'downgrade' ? 'Downgrade' : 'Same price'}
                  </Badge>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
      {/* Confirmation summary */}
      {selected && (
        <div className="rounded-lg border p-3 text-sm">
          <div className="font-medium mb-1">Change summary</div>
          <div className="text-muted-foreground">Current: {sub?.price || '-'}</div>
          <div className="text-muted-foreground">New: {plans.find(p => p.lookup_key === selected)?.display}</div>
          <div className="text-xs text-muted-foreground mt-1">Proration may apply. Your next invoice will reflect the difference.</div>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!confirming ? (
          <Button size="sm" variant="outline" onClick={() => setConfirming(true)} disabled={!selected}>Continue</Button>
        ) : (
          <>
            <Button size="sm" onClick={onSwap} disabled={saving}>{saving ? 'Switching…' : 'Confirm change'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Back</Button>
          </>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  )
}

function SubscriptionsTable() {
  const { props } = usePage<{ subscriptions?: SubscriptionRow[] | null }>()
  const rows = props.subscriptions ?? []
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No subscription history.</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Cycle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Period</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono text-xs">{s.id}</TableCell>
            <TableCell>{s.plan?.name || '-'}</TableCell>
            <TableCell>{s.plan?.interval ? s.plan.interval : '-'}</TableCell>
            <TableCell>
              <Badge variant={s.status === 'active' ? 'secondary' : 'outline'}>
                {s.cancelAtPeriodEnd ? `${s.status} (cancels at period end)` : s.status}
              </Badge>
            </TableCell>
            <TableCell>
              {(s.currentPeriodStart && s.currentPeriodEnd) ? `${s.currentPeriodStart} → ${s.currentPeriodEnd}` : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function OrdersTable() {
  const { props } = usePage<{ orders?: OrderRow[] | null }>()
  const rows = props.orders ?? []
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">No orders yet.</div>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((o) => (
          <TableRow key={o.id}>
            <TableCell>#{o.number}</TableCell>
            <TableCell>{o.status}</TableCell>
            <TableCell>{o.total}</TableCell>
            <TableCell>{o.createdAt || '-'}</TableCell>
            <TableCell className="text-right">
              {o.receiptUrl ? (
                <Button asChild size="sm" variant="outline"><a href={o.receiptUrl} target="_blank" rel="noreferrer">Receipt</a></Button>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
