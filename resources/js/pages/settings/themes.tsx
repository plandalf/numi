import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Theme } from '@/types/theme';
import ThemePreviewCard from '@/components/offers/theme-preview-card';
import SettingsLayout from '@/layouts/settings-layout';

interface Props {
    themes: Theme[];
}

export default function Themes({ themes }: Props) {
    const handleCreateTheme = () => {
        router.post(route('organizations.themes.store'));
    };

    return (
      <SettingsLayout>
        <Head title="Themes" />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Themes</h2>
            <p className="text-muted-foreground">
              Manage your organization's themes
            </p>
          </div>
          <Button onClick={handleCreateTheme}>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2">
          {themes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              onClick={() => router.visit(route('organizations.themes.edit', theme.id))}
            />
          ))}

          {themes.length === 0 && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>No Themes</CardTitle>
                <CardDescription>
                  You haven't created any themes yet. Create your first theme to get started.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleCreateTheme}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Theme
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </SettingsLayout>
    );
}
