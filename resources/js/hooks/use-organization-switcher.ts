import { router, usePage } from "@inertiajs/react";
import { Organization, SharedData } from "@/types";

export interface OrganizationSwitcherProps {
  onSwitch?: (id: number) => void;
  onCreate?: (name: string) => void;
}

export interface OrganizationSwitcherResponse {
  organizations: Organization[];
  currentOrganization: Organization;
  onSwitch: (id: number) => void;
  onCreate: (name: string) => void;
}

export function useOrganizationSwitcher({
  onSwitch,
  onCreate,
}: OrganizationSwitcherProps): OrganizationSwitcherResponse {
  const { auth } = usePage<SharedData>().props;

  const handleCreate = (name: string) => {
    router.post(route('organizations.store'), { name }, {
        onSuccess: () => {
          onCreate?.(name);
        },
    });
  };

  const handleSwitch = (id: number) => {
    router.post(route('organizations.switch', { organization: id }));
    onSwitch?.(id);
  };
   
  return {
    currentOrganization: auth?.user?.current_organization!,
    organizations: auth?.user?.organizations ?? [],
    onSwitch: handleSwitch,
    onCreate: handleCreate,
  } as OrganizationSwitcherResponse;
}