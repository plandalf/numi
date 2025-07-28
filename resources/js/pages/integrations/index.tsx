import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, PlugZap, TestTube } from 'lucide-react';
import { PageProps } from '@/types';
import { TutorialCard } from '@/components/onboarding/TutorialCard';

interface Integration {
  id: number;
  uuid: string;
  lookup_key: string;
  type: string;
  organization_id: number;
  name: string;
  secret: string | null;
  config: Record<string, unknown> | null;
  current_state: string;
  environment: 'live' | 'test';
  created_at: string;
  updated_at: string;
}

interface IntegrationsPageProps extends PageProps {
  integrations: Integration[];
  showIntegrationsTutorial: boolean;
}

export default function Integrate({ integrations, showIntegrationsTutorial }: IntegrationsPageProps) {
  return (
    <AppLayout>
      <Head title="Integrations" />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Integrations
          </h1>
          <div className="flex gap-2">
            <Link href="/integrations/stripe/authorizations" method="post" as="button">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Stripe Live Integration
              </Button>
            </Link>
            <Link href="/integrations/stripe_test/authorizations" method="post" as="button">
              <Button variant="outline">
                <TestTube className="w-4 h-4 mr-2" />
                Create Stripe Test Integration
              </Button>
            </Link>
          </div>
        </header>

        {/* Integrations Tutorial */}
        <TutorialCard
          title="Getting Started with Integrations"
          description="Integrations connect your offers to payment processors like Stripe and other third-party services. <b>Automate payments</b>, sync product catalogs, and streamline your business operations with powerful integrations."
          actions={[
            {
              label: 'Connect Stripe',
              onClick: () => window.location.href = '/integrations/stripe/authorizations',
              icon: PlugZap
            },
            {
              label: 'Learn More',
              onClick: () => window.open('https://www.plandalf.dev/docs/integrations', '_blank'),
              variant: 'outline' as const,
              icon: ExternalLink
            }
          ]}
          onboardingKey="integrations_tutorial"
          show={showIntegrationsTutorial}
          backgroundColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-amber-700 dark:text-amber-300"
          accentColor="bg-orange-600"
          accentHoverColor="hover:bg-orange-700"
        />

        {/* Integrations List */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {integrations.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No integrations found. Create one using the buttons above.
              </li>
            ) : (
              integrations.map((integration) => (
                <li key={integration.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <Link href={`/integrations/${integration.uuid}`} className="hover:underline">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {integration.name || integration.type}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Type: {integration.type} | Environment: {integration.environment}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {new Date(integration.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
