import { SharedData, Subscription } from '@/types';
import { usePage } from '@inertiajs/react';

export function useSubscriptions() {
  const { auth } = usePage<{ props: SharedData }>().props;
  return auth?.user?.current_organization?.subscriptions as Subscription[];
}
