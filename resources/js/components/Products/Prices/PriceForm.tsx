import { FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { type Price } from '@/types/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    productId: number;
    price?: Price;
    mode: 'create' | 'edit';
}

type Scope = 'list' | 'custom';
type PricingModel = 'one_time' | 'recurring' | 'tiered' | 'volume' | 'graduated';

export default function PriceForm({ productId, price, mode }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        scope: (price?.scope || 'list') as Scope,
        parent_list_price_id: price?.parent_list_price_id || null,
        pricing_model: (price?.pricing_model || 'one_time') as PricingModel,
        amount: price?.amount || 0,
        currency: price?.currency || 'USD',
        recurring_interval: price?.recurring_interval || null,
        recurring_interval_count: price?.recurring_interval_count || null,
        cancel_after_cycles: price?.cancel_after_cycles || null,
        properties: price?.properties || null,
        gateway_provider: price?.gateway_provider || '',
        gateway_price_id: price?.gateway_price_id || '',
        is_active: price?.is_active ?? true,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            post(route('products.prices.store', productId));
        } else {
            put(route('products.prices.update', [productId, price?.id]));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="scope">Scope</Label>
                    <Select
                        value={data.scope}
                        onValueChange={(value) => setData('scope', value as Scope)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="list">List Price</SelectItem>
                            <SelectItem value="custom">Custom Price</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.scope && (
                        <p className="text-sm text-red-500 mt-1">{errors.scope}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="pricing_model">Pricing Model</Label>
                    <Select
                        value={data.pricing_model}
                        onValueChange={(value) => setData('pricing_model', value as PricingModel)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select pricing model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="one_time">One Time</SelectItem>
                            <SelectItem value="recurring">Recurring</SelectItem>
                            <SelectItem value="tiered">Tiered</SelectItem>
                            <SelectItem value="volume">Volume</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.pricing_model && (
                        <p className="text-sm text-red-500 mt-1">{errors.pricing_model}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="amount">Amount (in cents)</Label>
                    <Input
                        id="amount"
                        type="number"
                        value={data.amount}
                        onChange={e => setData('amount', parseInt(e.target.value))}
                        placeholder="Enter amount in cents"
                    />
                    {errors.amount && (
                        <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                        id="currency"
                        value={data.currency}
                        onChange={e => setData('currency', e.target.value.toUpperCase())}
                        placeholder="USD"
                        maxLength={3}
                    />
                    {errors.currency && (
                        <p className="text-sm text-red-500 mt-1">{errors.currency}</p>
                    )}
                </div>

                {data.pricing_model === 'recurring' && (
                    <>
                        <div>
                            <Label htmlFor="recurring_interval">Recurring Interval</Label>
                            <Select
                                value={data.recurring_interval || ''}
                                onValueChange={(value) => setData('recurring_interval', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Daily</SelectItem>
                                    <SelectItem value="week">Weekly</SelectItem>
                                    <SelectItem value="month">Monthly</SelectItem>
                                    <SelectItem value="quarter">Quarterly</SelectItem>
                                    <SelectItem value="year">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.recurring_interval && (
                                <p className="text-sm text-red-500 mt-1">{errors.recurring_interval}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="recurring_interval_count">Interval Count</Label>
                            <Input
                                id="recurring_interval_count"
                                type="number"
                                value={data.recurring_interval_count || ''}
                                onChange={e => setData('recurring_interval_count', parseInt(e.target.value))}
                                placeholder="Enter interval count"
                            />
                            {errors.recurring_interval_count && (
                                <p className="text-sm text-red-500 mt-1">{errors.recurring_interval_count}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="cancel_after_cycles">Cancel After Cycles (Optional)</Label>
                            <Input
                                id="cancel_after_cycles"
                                type="number"
                                value={data.cancel_after_cycles || ''}
                                onChange={e => setData('cancel_after_cycles', parseInt(e.target.value))}
                                placeholder="Enter number of cycles"
                            />
                            {errors.cancel_after_cycles && (
                                <p className="text-sm text-red-500 mt-1">{errors.cancel_after_cycles}</p>
                            )}
                        </div>
                    </>
                )}

                <div>
                    <Label htmlFor="gateway_provider">Gateway Provider</Label>
                    <Input
                        id="gateway_provider"
                        value={data.gateway_provider}
                        onChange={e => setData('gateway_provider', e.target.value)}
                        placeholder="e.g., stripe"
                    />
                    {errors.gateway_provider && (
                        <p className="text-sm text-red-500 mt-1">{errors.gateway_provider}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="gateway_price_id">Gateway Price ID</Label>
                    <Input
                        id="gateway_price_id"
                        value={data.gateway_price_id}
                        onChange={e => setData('gateway_price_id', e.target.value)}
                        placeholder="e.g., price_123"
                    />
                    {errors.gateway_price_id && (
                        <p className="text-sm text-red-500 mt-1">{errors.gateway_price_id}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={processing}
                    className="relative transition-all duration-200 active:scale-95"
                >
                    <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                        {mode === 'create' ? 'Create Price' : 'Update Price'}
                    </div>
                    {processing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </Button>
            </div>
        </form>
    );
} 