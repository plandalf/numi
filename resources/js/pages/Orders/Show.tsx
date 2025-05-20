import { Head } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import cx from "classnames";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  price: {
    id: number;
    amount: number;
    currency: string;
    product: {
      id: number;
      name: string;
    };
  };
}

interface Order {
  id: number;
  uuid: string;
  status: string;
  currency: string;
  total_amount: number;
  completed_at: string | null;
  created_at: string;
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  checkout_session: {
    id: number;
    status: string;
  } | null;
}

interface OrdersShowProps extends PageProps {
  order: Order;
}

export default function Show({ auth, order }: OrdersShowProps) {
  console.log(order);
  return (
    <AppLayout>
      <Head title={`Order ${order.uuid}`} />

      <div className="container max-w-[100vw] mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
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
            <Badge className={cx('text-white whitespace-nowrap text-sm', {
              'bg-[#7EB500]': order.status === 'completed',
              'bg-[#808ABF]': order.status === 'pending',
              'bg-red-400': order.status === 'cancelled',
            })}>
              {order.status}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.price.product.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(item.total_amount, item.price.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(order.total_amount, order.currency)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                {order.customer ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Name</div>
                      <div>{order.customer.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div>{order.customer.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Guest customer</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div>{order.checkout_session?.status || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Completed At</div>
                    <div>{order.completed_at ? formatDate(order.completed_at) : 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
