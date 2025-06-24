import { Head } from '@inertiajs/react';
import { Building2, Play } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Organization } from '@/types';

interface SignupProps {
    organization?: Organization;
}

export default function Signup({ organization }: SignupProps) {
    return (
        <AuthLayout
            title={organization
                ? <div className="flex flex-row justify-center items-center gap-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    Join {organization.name}
                </div>
                : "Get started with us"
            }
            description="Watch our introduction video and create your account"
        >
            <Head title="Sign Up" />
            <div className="flex flex-col gap-6">
                {/* YouTube Video Container */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/QgQwuw_qk3s"
                        title="Introduction Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Call to Action Button */}
                <div className="grid gap-4">
                    <Button
                        className="w-full"
                        onClick={() => window.location.href = route('register')}
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {organization ? 'Create account and join team' : 'Create your account now'}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')}>
                        Log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
