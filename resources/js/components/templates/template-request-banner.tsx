import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OrigamiIcon } from 'lucide-react';

export interface TemplateRequestBannerProps {
    className?: string;
}

export function TemplateRequestBanner({ className }: TemplateRequestBannerProps) {
    return (
        <Card className={cn("bg-cyan-600 text-white p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <OrigamiIcon className="h-8 w-8" />
                    <div>
                        <h2 className="text-xl font-semibold">Request a Template</h2>
                        <p className="text-blue-100">We'll build any design you can imagine within a week</p>
                    </div>
                </div>
                <Button variant="secondary" className="bg-white text-blue-500 hover:bg-blue-50">
                    Request
                </Button>
            </div>
        </Card>
    );
} 