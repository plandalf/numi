import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { AppShell } from "@/components/app-shell";
import { OctagonMinusIcon } from "lucide-react";
import { useOrganizationSwitcher } from "@/hooks/use-organization-switcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NoAccess({ auth }: PageProps) {
    const { organizations, currentOrganization, onSwitch } = useOrganizationSwitcher({
        onSwitch: () => {
            router.visit(route('dashboard'));
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                <CardTitle className="flex flex-row items-center gap-2">
                    <OctagonMinusIcon className="text-red-500 mr-2 size-6" />
                    Your trial period for <b>{auth.user?.current_organization?.name}</b> has ended.
                </CardTitle>
                <CardDescription>
                    You can switch to another organization or upgrade to Plandalf to continue using {auth.user?.current_organization?.name}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Switch Organization</h3>
                    <Select
                        value={currentOrganization?.id?.toString()}
                        onValueChange={(value) => onSwitch(parseInt(value, 10))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id.toString()}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Upgrade to Plandalf</h3>
                    <p className="text-sm text-muted-foreground">
                        Get access to all features and continue using {auth.user?.current_organization?.name}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Button
                    variant="default" 
                    className="cursor-pointer"
                    onClick={() => window.location.href = route('organizations.settings.billing.checkout')}
                >
                    Upgrade Now
                </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
