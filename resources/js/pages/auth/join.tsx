import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, AlertCircle, Building2 } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Organization, SharedData } from '@/types';
import TextLink from '@/components/text-link';

interface JoinPageProps {
    organization?: Organization;
}

export default function Join({ organization }: JoinPageProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { post, processing } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('organizations.join'));
    };

    if (!organization) {
        return (
            <AuthLayout 
                title={
                    <div className="flex flex-row justify-center items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        Invalid Invitation
                    </div>
                }
                description=" This invitation link is invalid or has expired. Please contact the organization administrator for a new invitation."
            >
                <Head title="Invalid Invitation" />
                {!auth.user && (
                    <div className="text-muted-foreground text-center text-sm">
                        Don't have an account?{' '}
                        <TextLink href={route('register')}>
                            Register
                        </TextLink>
                        {' '}or{' '}
                        <TextLink href={route('login')}>
                            Log in
                        </TextLink>
                    </div>
                )}
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            title={
                <div className="flex flex-row justify-center items-center gap-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    Join {organization.name}
                </div>
            }
            description="You've been invited to join this organization. Click the button below to join."
        >
            <Head title={`Join ${organization.name}`} />
            
            <div className="flex flex-col items-center gap-6">
                <form className="w-full" onSubmit={submit}>
                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                        Join Team
                    </Button>
                </form>
                
                {!auth.user && (
                    <div className="text-muted-foreground text-center text-sm">
                       Already have an account?{' '}
                        <TextLink href={route('login')}>
                            Log in
                        </TextLink>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
} 