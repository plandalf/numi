import { useCurrentOrganization } from '@/hooks/use-current-organization';
import AppLogoIcon from './app-logo-icon';
import { useSubscriptions } from '@/hooks/use-subscriptions';

export default function AppLogo() {
    const organization = useCurrentOrganization();

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center ">
                    <AppLogoIcon className="" />
                </div>
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-none font-semibold">Numi</span>
                </div>
            </div>
            {
                organization?.on_trial && (
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {organization?.trial_days_left} days trial left
                    </div>
                )
            }
        </div>
    );
}
