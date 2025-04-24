import { Organization, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function useCurrentOrganization() {
  const { auth } = usePage<{ props: SharedData }>().props;
  return auth?.user?.current_organization as Organization;
}
