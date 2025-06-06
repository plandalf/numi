import { useCurrentOrganization } from '@/hooks/use-current-organization';
import AppLogoIcon from './app-logo-icon';
import { useSubscriptions } from '@/hooks/use-subscriptions';

export default function AppLogo() {

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center ">
                    <AppLogoIcon className="" />
                </div>
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="truncate leading-none font-semibold text-xl uppercase font-sora">Plandalf</span>
                </div>
            </div>

        </div>
    );
}
