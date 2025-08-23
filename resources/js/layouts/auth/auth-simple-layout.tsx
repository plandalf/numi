import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import AppLogo from '@/components/app-logo';
import { OrganizationSwitcher } from '@/components/organization-switcher';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
      <div className="min-h-svh flex flex-col">
        <div className="h-14 bg-gray-900 text-white flex justify-between items-center px-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" prefetch>
              <AppLogo />
            </Link>
          </div>
        </div>
        <div className="bg-card flex flex-col flex-grow items-center justify-center gap-6 p-6 md:p-10">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="space-y-2 text-center">
                  <h1 className="text-xl font-medium">{title}</h1>
                  <p className="text-muted-foreground text-center text-sm">{description}</p>
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
        <div>footer</div>
      </div>
    );
}
