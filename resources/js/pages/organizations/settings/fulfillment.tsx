import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, Mail } from "lucide-react";

interface Props {
    organization: Organization;
}

const FULFILLMENT_METHODS = {
    manual: { label: 'Manual', description: 'Manually fulfill each order' },
    automation: { label: 'Automation', description: 'Automatically fulfill orders using predefined rules' },
    api: { label: 'API', description: 'Fulfill orders via API calls to external services' },
    external_webhook: { label: 'External Webhook', description: 'Send fulfillment data to external platforms via webhooks' },
    hybrid: { label: 'Hybrid', description: 'Combination of automatic and manual fulfillment' },
} as const;

const DELIVERY_METHODS = {
    physical_shipping: { label: 'Physical Shipping', description: 'Ship physical products' },
    digital_download: { label: 'Digital Download', description: 'Provide downloadable digital products' },
    email_delivery: { label: 'Email Delivery', description: 'Send products via email' },
    api_provisioning: { label: 'API Provisioning', description: 'Provision services via API' },
    manual_provision: { label: 'Manual Provision', description: 'Manually provision services' },
    virtual_delivery: { label: 'Virtual Delivery', description: 'Deliver virtual products' },
    instant_access: { label: 'Instant Access', description: 'Provide instant access to products' },
    external_platform: { label: 'External Platform', description: 'Fulfill via external platform' },
} as const;

export default function Fulfillment({ organization }: Props) {
    const form = useForm({
        fulfillment_method: organization.fulfillment_method || 'manual',
        default_delivery_method: organization.default_delivery_method || 'digital_download',
        fulfillment_notification_email: organization.fulfillment_notification_email || '',
        auto_fulfill_orders: organization.auto_fulfill_orders || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('organizations.settings.fulfillment.update'));
    };

    const testEmailForm = useForm({
        email: form.data.fulfillment_notification_email || '',
    });

    const handleTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure we have the latest email value
        const currentEmail = form.data.fulfillment_notification_email;
        if (!currentEmail) {
            return; // Don't submit if no email
        }
        
        testEmailForm.setData('email', currentEmail);
        testEmailForm.post(route('organizations.settings.fulfillment.test-email'));
    };

    return (
        <SettingsLayout>
            <Head title="Fulfillment Settings" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Fulfillment Configuration</CardTitle>
                        <CardDescription>
                            Configure how orders are fulfilled and delivered to customers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Fulfillment Method */}
                        <div className="space-y-2">
                          <Label htmlFor="fulfillment_method">Fulfillment Method</Label>
                          <Select
                            value={form.data.fulfillment_method}
                            onValueChange={(value) => form.setData('fulfillment_method', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fulfillment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FULFILLMENT_METHODS).map(([value, { label, description }]) => (
                                <SelectItem key={value} value={value}>
                                  <div className="">
                                    <span className="font-medium">{label}</span>&nbsp;
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.errors.fulfillment_method && (
                            <p className="text-red-500 text-sm">{form.errors.fulfillment_method}</p>
                          )}
                        </div>

                        {/* Default Delivery Method */}
                        <div className="space-y-2">
                          <Label htmlFor="default_delivery_method">Default Delivery Method</Label>
                          <Select
                            value={form.data.default_delivery_method}
                            onValueChange={(value) => form.setData('default_delivery_method', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery method" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DELIVERY_METHODS).map(([value, { label, description }]) => (
                                <SelectItem key={value} value={value}>
                                  <div className="">
                                    <span className="font-medium">{label}</span>&nbsp;
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.errors.default_delivery_method && (
                            <p className="text-red-500 text-sm">{form.errors.default_delivery_method}</p>
                          )}
                        </div>

                        {/* Notification Email */}
                        <div className="space-y-2">
                          <Label htmlFor="fulfillment_notification_email">Fulfillment Notification Email</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="fulfillment_notification_email"
                              type="email"
                              value={form.data.fulfillment_notification_email}
                              onChange={(e) => form.setData('fulfillment_notification_email', e.target.value)}
                              placeholder="admin@example.com"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleTestEmail}
                              disabled={testEmailForm.processing || !form.data.fulfillment_notification_email}
                              title={!form.data.fulfillment_notification_email ? "Please enter an email address first" : "Send a test fulfillment email"}
                            >
                              {testEmailForm.processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                              Test
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">
                            Email address to receive fulfillment notifications. 
                            <span className="text-orange-600 font-medium"> Note: You need at least one order in your organization to test emails.</span>
                          </p>
                          {form.errors.fulfillment_notification_email && (
                            <p className="text-red-500 text-sm">{form.errors.fulfillment_notification_email}</p>
                          )}
                          {testEmailForm.errors.email && (
                            <p className="text-red-500 text-sm">{testEmailForm.errors.email}</p>
                          )}
                        </div>

                        {/* Auto Fulfill Orders */}
                        <div className="flex items-center space-x-3">
                          <Switch
                            id="auto_fulfill_orders"
                            checked={form.data.auto_fulfill_orders}
                            onCheckedChange={(checked) => form.setData('auto_fulfill_orders', checked)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="auto_fulfill_orders">Auto Fulfill Orders</Label>
                            <p className="text-sm text-gray-500">
                              Automatically fulfill orders when payment is completed
                            </p>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={form.processing}
                        >
                          {form.processing && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Fulfillment Settings
                        </Button>
                      </form>
                    </CardContent>
                </Card>

                {/* Fulfillment Status Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fulfillment Status</CardTitle>
                    <CardDescription>
                      Overview of your fulfillment configuration and status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Current Method</div>
                        <div className="text-lg font-semibold">
                          {FULFILLMENT_METHODS[form.data.fulfillment_method as keyof typeof FULFILLMENT_METHODS]?.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {FULFILLMENT_METHODS[form.data.fulfillment_method as keyof typeof FULFILLMENT_METHODS]?.description}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Default Delivery</div>
                        <div className="text-lg font-semibold">
                          {DELIVERY_METHODS[form.data.default_delivery_method as keyof typeof DELIVERY_METHODS]?.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {DELIVERY_METHODS[form.data.default_delivery_method as keyof typeof DELIVERY_METHODS]?.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
} 