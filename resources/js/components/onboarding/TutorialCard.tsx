import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface TutorialAction {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
    icon?: React.ComponentType<{ className?: string }>;
}

interface TutorialCardProps {
    title: string;
    description: string;
    videoUrl?: string;
    videoTitle?: string;
    videoDuration?: string;
    actions: TutorialAction[];
    onboardingKey: string;
    show: boolean;
    onDismiss?: () => void;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    accentColor?: string;
    accentHoverColor?: string;
}

export function TutorialCard({
    title,
    description,
    videoUrl,
    videoTitle,
    videoDuration,
    actions,
    onboardingKey,
    show,
    onDismiss,
    backgroundColor = 'bg-orange-50',
    borderColor = 'border-orange-200',
    textColor = 'text-amber-700 dark:text-amber-300',
    accentColor = 'bg-orange-600',
    accentHoverColor = 'hover:bg-orange-700'
}: TutorialCardProps) {
    const [isVisible, setIsVisible] = useState(show);

    const markTutorialAsSeen = async () => {
        try {
            await axios.post(route('onboarding.info.seen', onboardingKey));
            setIsVisible(false);
            onDismiss?.();
        } catch (error) {
            console.error('Failed to mark tutorial as seen:', error);
            // Still hide the tutorial in case of error to prevent user frustration
            setIsVisible(false);
            onDismiss?.();
        }
    };

    const handleDismiss = () => {
        console.log(`dismissing ${onboardingKey} tutorial`);
        markTutorialAsSeen();
    };

    const handleActionClick = (action: TutorialAction) => {
        if (isVisible) {
            markTutorialAsSeen();
        }
        action.onClick();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className={`${backgroundColor} ${borderColor} border rounded-lg shadow-sm relative p-6`}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-3 top-3 h-7 w-7 p-0 ${accentColor} text-white border-none ${accentHoverColor} rounded-full`}
                    onClick={handleDismiss}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
                
                <div className="pr-10">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    
                    <div className="grid md:grid-cols-5 gap-6">
                        {/* Video Section */}
                        {videoUrl && (
                            <div className="md:col-span-2 space-y-3">
                                <div className={`relative aspect-video rounded-lg bg-white dark:bg-gray-900 border-2 ${borderColor} dark:border-gray-700 overflow-hidden shadow-sm`}>
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={videoUrl}
                                        title={videoTitle || title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                {videoDuration && (
                                    <p className={`text-sm ${textColor} text-center font-medium`}>
                                        {videoDuration}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Info Section */}
                        <div className={`${videoUrl ? 'md:col-span-3' : 'md:col-span-5'} flex items-center`}>
                            <div className="space-y-4">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />
                                <div className="flex flex-wrap gap-3">
                                    {actions.map((action, index) => {
                                        const IconComponent = action.icon;
                                        return (
                                            <Button 
                                                key={index}
                                                variant={action.variant || 'default'}
                                                onClick={() => handleActionClick(action)}
                                                className="flex-shrink-0"
                                            >
                                                {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                                                {action.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 