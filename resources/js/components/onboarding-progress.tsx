import { Check, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PieChart } from '@/components/ui/pie-chart';
import { usePage, Link } from '@inertiajs/react';
import { OnboardingData } from '@/types';

export function OnboardingProgress() {
    const { onboarding } = usePage<{ onboarding: OnboardingData | null }>().props;

    // Don't show if no onboarding data, if complete, or if no incomplete steps
    if (!onboarding || onboarding.is_complete || onboarding.incomplete_steps.length === 0) {
        return null;
    }

    const getStepLink = (stepKey: string): string => {
        switch (stepKey) {
            case 'profile_setup':
                return route('organizations.settings.general');
            case 'first_offer':
                return route('dashboard');
            case 'payment_setup':
                return route('integrations.index');
            case 'theme_customization':
                return route('organizations.themes.index');
            case 'domain_setup':
                return route('organizations.settings.general');
            case 'team_setup':
                return route('organizations.settings.team');
            case 'integration_setup':
                return route('integrations.index');
            case 'first_sale':
                return route('orders.index');
            default:
                return route('dashboard');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="dark-outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-gray-800 relative"
                >
                    <PieChart percentage={onboarding.completion_percentage} size={18} />
                    <span className="hidden sm:inline">Getting Started</span>
                    <span className="text-xs">
                        {onboarding.completion_percentage.toFixed(0)}%
                    </span>
                    <ChevronDown className="size-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Getting Started</h4>
                        <span className="text-xs text-muted-foreground">
                            {onboarding.completed_steps.length} of {onboarding.steps.length}
                        </span>
                    </div>
                    <div className="h-2 mb-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${onboarding.completion_percentage}%` }}
                        />
                    </div>
                    <div className="space-y-1">
                        {onboarding.steps.map((step) => {
                            const isActionable = step.key !== 'first_sale';
                            
                            if (isActionable) {
                                return (
                                    <DropdownMenuItem key={step.key} className="p-0" asChild>
                                        <Link
                                            href={getStepLink(step.key)}
                                            className={`flex items-start gap-3 p-2 hover:bg-gray-50 rounded-sm ${
                                                step.completed ? 'opacity-75' : ''
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                                step.completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300'
                                            }`}>
                                                {step.completed && <Check className="size-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium flex items-center gap-2 ${
                                                    step.completed ? 'line-through text-muted-foreground' : ''
                                                }`}>
                                                    {step.label}
                                                    <ExternalLink className="size-3 opacity-50" />
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {step.description}
                                                </div>
                                            </div>
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            }
                            
                            return (
                                <DropdownMenuItem key={step.key} className="p-0">
                                    <div className={`flex items-start gap-3 p-2 cursor-default ${
                                        step.completed ? 'opacity-75' : 'opacity-60'
                                    }`}>
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                            step.completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300'
                                        }`}>
                                            {step.completed && <Check className="size-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium ${
                                                step.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                                            }`}>
                                                {step.label}
                                                <span className="text-xs ml-1">(milestone)</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {step.description}
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 