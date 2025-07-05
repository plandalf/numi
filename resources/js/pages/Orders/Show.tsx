import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import cx from "classnames";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  User,
  Truck,
  Download,
  ExternalLink
} from 'lucide-react';
import { Discount } from '@/types/product';

type User = { id: number; name: string; email: string; };

interface PageProps {
  auth: {
    user: User;
  };
  errors?: Record<string, string>;
  flash?: { success?: string; error?: string };
}

interface OrderItem {
  id: number;
  quantity: number;
  total_amount: number;
  fulfillment_status: {
    value: string;
    label: string;
    color: string;
  };
  delivery_method: {
    value: string;
    label: string;
  };
  quantity_fulfilled: number;
  quantity_remaining: number;
  fulfillment_progress: number;
  tracking_number: string | null;
  tracking_url: string | null;
  delivery_assets: { id: number; name: string; url: string }[] | null;
  fulfillment_notes: string | null;
  unprovisionable_reason: string | null;
  fulfilled_at: string | null;
  fulfilled_by: {
    id: number;
    name: string;
    email: string;
  } | null;
  price: {
    id: number;
    amount: number;
    currency: string;
    product: {
      id: number;
      name: string;
      image_url: string | null;
    };
  };
}

interface OrderEvent {
  id: number;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface Order {
  id: number;
  uuid: string;
  status: {
    value: string;
    label: string;
  };
  currency: string;
  total_amount: number;
  completed_at: string | null;
  created_at: string;
  fulfillment_method: {
    value: string;
    label: string;
  } | null;
  fulfillment_summary: {
    total_items: number;
    fulfilled_items: number;
    pending_items: number;
    unprovisionable_items: number;
  };
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  checkout_session: {
    id: number;
    status: string;
    discounts: Discount[];
  } | null;
  events: OrderEvent[];
}

interface OrdersShowProps extends PageProps {
  order: Order;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'order_created': return '🎉';
    case 'order_completed': return '✅';
    case 'order_cancelled': return '❌';
    case 'fulfillment_initialized': return '📦';
    case 'item_fulfilled': return '✅';
    case 'item_unprovisionable': return '❌';
    case 'order_shipped': return '🚚';
    case 'order_delivered': return '📍';
    case 'manual_fulfillment': return '👤';
    case 'note_added': return '📝';
    default: return '📄';
  }
};

const UpdateFulfillmentDialog = ({ 
    item, 
    orderUuid, 
    onClose, 
    errors, 
    flash 
}: { 
    item: OrderItem; 
    orderUuid: string; 
    onClose: () => void; 
    errors?: Record<string, string>;
    flash?: { success?: string; error?: string };
}) => {
    const { data, setData, post, processing, setError, clearErrors } = useForm({
        fulfillment_status: item.fulfillment_status.value,
        quantity_fulfilled: item.quantity_fulfilled,
        notes: item.fulfillment_notes || '',
        metadata: {} as Record<string, string | number | boolean>,
        tracking_number: item.tracking_number || '',
        tracking_url: item.tracking_url || '',
        unprovisionable_reason: item.unprovisionable_reason || '',
        delivery_assets: item.delivery_assets || [] as Array<{id?: number; name: string; url: string}>,
    });

    const [newAsset, setNewAsset] = useState({ name: '', url: '' });
    const [metadataKey, setMetadataKey] = useState('');
    const [metadataValue, setMetadataValue] = useState('');

    // Handle nested validation errors
    React.useEffect(() => {
        if (errors) {
            Object.entries(errors).forEach(([key, value]) => {
                // Use type assertion to handle nested keys
                (setError as (key: string, value: string) => void)(key, value);
            });
        }
    }, [errors, setError]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        post(route('orders.fulfillment.item.update', { order: orderUuid, orderItem: item.id }), {
            onSuccess: () => {
                if (flash?.success) {
                    // Show success message briefly before closing
                    setTimeout(() => onClose(), 1000);
                } else {
                    onClose();
                }
            },
        });
    };

    const addMetadata = () => {
        if (metadataKey && metadataValue) {
            setData('metadata', {
                ...data.metadata,
                [metadataKey]: metadataValue
            });
            setMetadataKey('');
            setMetadataValue('');
        }
    };

    const removeMetadata = (key: string) => {
        const newMetadata = { ...data.metadata };
        delete newMetadata[key];
        setData('metadata', newMetadata);
    };

    const addAsset = () => {
        if (newAsset.name && newAsset.url) {
            setData('delivery_assets', [
                ...data.delivery_assets,
                { ...newAsset }
            ]);
            setNewAsset({ name: '', url: '' });
        }
    };

    const removeAsset = (index: number) => {
        const newAssets = data.delivery_assets.filter((_, i) => i !== index);
        setData('delivery_assets', newAssets);
    };

    // Helper function to get error for a specific field
    const getError = (fieldName: string) => {
        return errors?.[fieldName];
    };

    // Helper function to get nested error for delivery assets
    const getDeliveryAssetError = (index: number, field: string) => {
        return errors?.[`delivery_assets.${index}.${field}`];
    };

    return (
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Update Fulfillment - {item.price.product.name}</DialogTitle>
            </DialogHeader>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{flash.success}</p>
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{flash.error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Fulfillment Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="fulfillment_status">Fulfillment Status *</Label>
                        <select
                            id="fulfillment_status"
                            value={data.fulfillment_status}
                            onChange={(e) => setData('fulfillment_status', e.target.value)}
                            className={cx(
                                "mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
                                getError('fulfillment_status') 
                                    ? "border-red-300" 
                                    : "border-gray-300"
                            )}
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="partially_fulfilled">Partially Fulfilled</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="unprovisionable">Unprovisionable</option>
                        </select>
                        {getError('fulfillment_status') && (
                            <p className="mt-1 text-sm text-red-600">{getError('fulfillment_status')}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="quantity_fulfilled">Quantity Fulfilled *</Label>
                        <Input
                            id="quantity_fulfilled"
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={data.quantity_fulfilled}
                            onChange={(e) => setData('quantity_fulfilled', parseInt(e.target.value))}
                            className={cx(
                                "mt-1",
                                getError('quantity_fulfilled') && "border-red-300"
                            )}
                            required
                        />
                        {getError('quantity_fulfilled') && (
                            <p className="mt-1 text-sm text-red-600">{getError('quantity_fulfilled')}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Total quantity: {item.quantity} • Remaining: {item.quantity - data.quantity_fulfilled}
                        </p>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <Label htmlFor="notes">Fulfillment Notes</Label>
                    <Textarea
                        id="notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Add notes about this fulfillment update..."
                        className={cx(
                            "mt-1",
                            getError('notes') && "border-red-300"
                        )}
                        rows={3}
                    />
                    {getError('notes') && (
                        <p className="mt-1 text-sm text-red-600">{getError('notes')}</p>
                    )}
                </div>

                {/* Tracking Information */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="tracking_number">Tracking Number</Label>
                        <Input
                            id="tracking_number"
                            value={data.tracking_number}
                            onChange={(e) => setData('tracking_number', e.target.value)}
                            placeholder="Enter tracking number..."
                            className={cx(
                                "mt-1",
                                getError('tracking_number') && "border-red-300"
                            )}
                        />
                        {getError('tracking_number') && (
                            <p className="mt-1 text-sm text-red-600">{getError('tracking_number')}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="tracking_url">Tracking URL</Label>
                        <Input
                            id="tracking_url"
                            type="url"
                            value={data.tracking_url}
                            onChange={(e) => setData('tracking_url', e.target.value)}
                            placeholder="Enter tracking URL..."
                            className={cx(
                                "mt-1",
                                getError('tracking_url') && "border-red-300"
                            )}
                        />
                        {getError('tracking_url') && (
                            <p className="mt-1 text-sm text-red-600">{getError('tracking_url')}</p>
                        )}
                    </div>
                </div>

                {/* Unprovisionable Reason (only show if status is unprovisionable) */}
                {data.fulfillment_status === 'unprovisionable' && (
                    <div>
                        <Label htmlFor="unprovisionable_reason">Unprovisionable Reason *</Label>
                        <Textarea
                            id="unprovisionable_reason"
                            value={data.unprovisionable_reason}
                            onChange={(e) => setData('unprovisionable_reason', e.target.value)}
                            placeholder="Explain why this item cannot be fulfilled..."
                            className={cx(
                                "mt-1",
                                getError('unprovisionable_reason') && "border-red-300"
                            )}
                            required
                            rows={3}
                        />
                        {getError('unprovisionable_reason') && (
                            <p className="mt-1 text-sm text-red-600">{getError('unprovisionable_reason')}</p>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div>
                    <Label className="text-sm font-medium">Custom Metadata</Label>
                    <div className="mt-2 space-y-2">
                        {/* Add metadata */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Key"
                                value={metadataKey}
                                onChange={(e) => setMetadataKey(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Value"
                                value={metadataValue}
                                onChange={(e) => setMetadataValue(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" onClick={addMetadata} size="sm">
                                Add
                            </Button>
                        </div>

                        {/* Show existing metadata */}
                        {Object.entries(data.metadata).length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm font-medium mb-2">Current Metadata:</div>
                                {Object.entries(data.metadata).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between text-sm">
                                        <span><strong>{key}:</strong> {String(value)}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeMetadata(key)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Delivery Assets */}
                <div>
                    <Label className="text-sm font-medium">Delivery Assets (Files/Downloads)</Label>
                    <div className="mt-2 space-y-2">
                        {/* Add asset */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Asset name"
                                value={newAsset.name}
                                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Asset URL"
                                value={newAsset.url}
                                onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                                className="flex-1"
                            />
                            <Button type="button" onClick={addAsset} size="sm">
                                Add
                            </Button>
                        </div>

                        {/* Show existing assets */}
                        {data.delivery_assets.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm font-medium mb-2">Current Assets:</div>
                                {data.delivery_assets.map((asset, index) => {
                                    const nameError = getDeliveryAssetError(index, 'name');
                                    const urlError = getDeliveryAssetError(index, 'url');
                                    
                                    return (
                                        <div key={index} className="space-y-2 mb-3 p-2 border rounded">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                    <strong>{asset.name}:</strong>{' '}
                                                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                        {asset.url}
                                                    </a>
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeAsset(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            {nameError && (
                                                <p className="text-sm text-red-600">{nameError}</p>
                                            )}
                                            {urlError && (
                                                <p className="text-sm text-red-600">{urlError}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Updating...' : 'Update Fulfillment'}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
};

const ItemFulfillmentCard = ({ item, orderUuid, errors, flash }: { item: OrderItem; orderUuid: string; errors?: Record<string, string>; flash?: { success?: string; error?: string } }) => {
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

    return (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold">{item.price.product.name}</h4>
                            <p className="text-sm text-gray-600">
                                Qty: {item.quantity} • {formatMoney(item.price.amount, item.price.currency)} • {item.delivery_method.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: item.fulfillment_status.color, color: 'white' }}>
                            {item.fulfillment_status.label}
                        </Badge>
                    </div>
                </div>
                
                <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Progress: {item.quantity_fulfilled} of {item.quantity} fulfilled</span>
                        <span>{item.fulfillment_progress}%</span>
                    </div>
                    <Progress value={item.fulfillment_progress} className="h-2" />
                </div>

                {/* Delivery Information */}
                {(item.tracking_number || item.delivery_assets) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        {item.tracking_number && (
                            <div className="flex items-center gap-2 text-sm">
                                <Truck className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Tracking:</span>
                                {item.tracking_url ? (
                                    <a href={item.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                        {item.tracking_number}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    <span>{item.tracking_number}</span>
                                )}
                            </div>
                        )}
                        {item.delivery_assets && item.delivery_assets.length > 0 && (
                            <div className="flex items-center gap-2 text-sm mt-2">
                                <Download className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Downloads Available:</span>
                                <span>{item.delivery_assets.length} files</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Fulfillment Notes */}
                {item.fulfillment_notes && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                                <span className="font-medium text-green-700">Fulfillment Notes: </span>
                                <span className="text-green-600">{item.fulfillment_notes}</span>
                                {item.fulfilled_by && (
                                    <p className="text-xs text-green-500 mt-1">
                                        by {item.fulfilled_by.name} on {formatDate(item.fulfilled_at!)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Unprovisionable Reason */}
                {item.unprovisionable_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                                <span className="font-medium text-red-700">Unprovisionable: </span>
                                <span className="text-red-600">{item.unprovisionable_reason}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                    <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Update Fulfillment
                            </Button>
                        </DialogTrigger>
                        <UpdateFulfillmentDialog
                            item={item}
                            orderUuid={orderUuid}
                            onClose={() => setUpdateDialogOpen(false)}
                            errors={errors}
                            flash={flash}
                        />
                    </Dialog>
                </div>
            </CardHeader>
        </Card>
    );
};

export default function Show({ order, errors, flash }: OrdersShowProps) {
    return (
        <AppLayout>
            <Head title={`Order ${order.uuid}`} />

            <div className="container max-w-[100vw] mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                                Order {order.uuid}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Created on {formatDate(order.created_at)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className={cx('text-white whitespace-nowrap text-sm', {
                                'bg-[#7EB500]': order.status.value === 'completed',
                                'bg-[#808ABF]': order.status.value === 'pending',
                                'bg-red-400': order.status.value === 'cancelled',
                            })}>
                                {order.status.label}
                            </Badge>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Customer</p>
                                        <p className="text-lg font-semibold">{order.customer?.name || 'Guest'}</p>
                                        <p className="text-sm text-gray-600">{order.customer?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                        <p className="text-lg font-semibold">{formatMoney(order.total_amount, order.currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                        <Badge className={cx('text-white', {
                                            'bg-[#7EB500]': order.status.value === 'completed',
                                            'bg-[#808ABF]': order.status.value === 'pending',
                                            'bg-red-400': order.status.value === 'cancelled',
                                        })}>
                                            {order.status.label}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Created</p>
                                        <p className="text-lg font-semibold">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.price.product.name}</div>
                                                    <div className="text-sm text-gray-600">{item.delivery_method.label}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{item.quantity_fulfilled} / {item.quantity}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {item.quantity_remaining > 0 && `${item.quantity_remaining} remaining`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatMoney(item.price.amount, item.price.currency)}</TableCell>
                                                <TableCell>{formatMoney(item.total_amount, order.currency)}</TableCell>
                                                <TableCell>
                                                    <Badge style={{ backgroundColor: item.fulfillment_status.color, color: 'white' }}>
                                                        {item.fulfillment_status.label}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Discounts */}
                        {order.checkout_session?.discounts && order.checkout_session.discounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Discounts Applied</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {order.checkout_session.discounts.map((discount, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                                                <div>
                                                    <span className="font-medium">{discount.name}</span>
                                                </div>
                                                <span className="text-green-600 font-medium">
                                                    {discount.amount_off ? (
                                                        `-${formatMoney(discount.amount_off, order.currency)}`
                                                    ) : discount.percent_off ? (
                                                        `-${discount.percent_off}%`
                                                    ) : (
                                                        'Applied'
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="fulfillment" className="space-y-6">
                        {/* Fulfillment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Fulfillment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{order.fulfillment_summary.total_items}</div>
                                        <div className="text-sm text-gray-500">Total Items</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{order.fulfillment_summary.fulfilled_items}</div>
                                        <div className="text-sm text-gray-500">Fulfilled</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">{order.fulfillment_summary.pending_items}</div>
                                        <div className="text-sm text-gray-500">Pending</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{order.fulfillment_summary.unprovisionable_items}</div>
                                        <div className="text-sm text-gray-500">Unprovisionable</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>
                                            {order.fulfillment_summary.fulfilled_items} of {order.fulfillment_summary.total_items} items fulfilled
                                        </span>
                                    </div>
                                    <Progress 
                                        value={order.fulfillment_summary.total_items > 0 
                                            ? (order.fulfillment_summary.fulfilled_items / order.fulfillment_summary.total_items) * 100
                                            : 0} 
                                        className="h-2" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fulfillment Items */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Items to Fulfill</h3>
                                <Link href={route('orders.fulfillment', order.uuid)}>
                                    <Button size="sm" variant="outline">
                                        Full Fulfillment Page
                                    </Button>
                                </Link>
                            </div>
                            
                            {order.items.map((item) => (
                                <ItemFulfillmentCard
                                    key={item.id}
                                    item={item}
                                    orderUuid={order.uuid}
                                    errors={errors}
                                    flash={flash}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="events" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.events.map((event) => (
                                        <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-lg">{getEventIcon(event.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{event.description}</p>
                                                    <time className="text-sm text-gray-500">{formatDate(event.created_at)}</time>
                                                </div>
                                                {event.user && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        by {event.user.name}
                                                    </p>
                                                )}
                                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        <details className="cursor-pointer">
                                                            <summary className="font-medium">Details</summary>
                                                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                                                {JSON.stringify(event.metadata, null, 2)}
                                                            </pre>
                                                        </details>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
