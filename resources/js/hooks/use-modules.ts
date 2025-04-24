import { Modules, SharedData, Subscription } from '@/types';
import { usePage } from '@inertiajs/react';

export function useModules() {
  const { modules } = usePage<{ props: SharedData }>().props;
  return modules as Record<Modules, boolean>;
}
