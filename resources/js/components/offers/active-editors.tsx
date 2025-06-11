import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEchoPresence } from '@laravel/echo-react';
import { useEffect, useState, memo, useRef } from 'react';

interface ActiveUser {
    id: number;
    name: string;
    avatar?: string;
}

interface ActiveEditorsProps {
    offerId: number;
}

// Simple memoized component to prevent re-renders
export const ActiveEditors = memo(({ offerId }: ActiveEditorsProps) => {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const { auth, url } = (usePage().props as unknown) as SharedData & { url: string };
    const currentUserId = auth.user.id;
    const getInitials = useInitials();

    // Simple presence channel setup
    const { channel, leave } = useEchoPresence(`offer.${offerId}.editing`);
    
    // Use ref to store leave function to avoid dependencies
    const leaveRef = useRef(leave);
    leaveRef.current = leave;

    // Track the current URL to detect actual page changes
    const currentUrl = useRef(url);

    useEffect(() => {
        if (!channel) return;

        const presenceChannel = channel();

        presenceChannel.here((users: ActiveUser[]) => {
            setActiveUsers(users.filter(user => user.id !== currentUserId));
        });

        presenceChannel.joining((user: ActiveUser) => {
            if (user.id !== currentUserId) {
                setActiveUsers(prev => {
                    if (prev.some(u => u.id === user.id)) return prev;
                    return [...prev, user];
                });
            }
        });

        presenceChannel.leaving((user: ActiveUser) => {
            setActiveUsers(prev => prev.filter(u => u.id !== user.id));
        });

        // Cleanup when effect re-runs or component unmounts
        return () => {
            leaveRef.current();
        };
    }, [channel, currentUserId]);

    // Detect actual page navigation by watching URL changes
    useEffect(() => {
        if (currentUrl.current !== url) {
            // URL changed - this means we navigated to a different page
            if (currentUrl.current) { // Only leave if we had a previous URL (not initial load)
                leaveRef.current();
            }
            currentUrl.current = url;
        }
    }, [url]);

    // Handle browser navigation/refresh only
    useEffect(() => {
        const handleBeforeUnload = () => {
            leaveRef.current();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                leaveRef.current();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // Empty dependency array - this only runs once

    if (activeUsers.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
                {activeUsers.slice(0, 3).map((user) => (
                    <TooltipProvider key={user.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="bg-gray-800">
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.name} is editing</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
                {activeUsers.length > 3 && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                            +{activeUsers.length - 3}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});

ActiveEditors.displayName = 'ActiveEditors'; 