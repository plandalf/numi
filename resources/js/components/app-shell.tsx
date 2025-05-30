import { SidebarProvider } from '@/components/ui/sidebar';
import React, { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Link, usePage } from '@inertiajs/react';
import { UserInfo } from '@/components/user-info';
import { AlertCircleIcon, ChevronsUpDown } from 'lucide-react';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { MessageCircle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { auth } = usePage<Record<string, any>>().props;

  const organization = useCurrentOrganization();

  // Feedback popover state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/feedback', { feedback });
      setSuccess(true);
      setFeedback('');
    } catch {
      setError('Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div>
        <div className="h-14 bg-gray-900 text-white flex justify-between items-center px-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" prefetch>
              <AppLogo />
            </Link>

            <OrganizationSwitcher />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6">
              {
                organization?.on_trial && (
                  <Link href="/organizations/settings/billing" className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-medium hover:bg-yellow-200 font-semibold flex items-center gap-1">
                    <AlertCircleIcon className="size-4" /> {organization?.trial_days_left} day{organization?.trial_days_left === 1 ? '' : 's'} trial left
                  </Link>
                )
              }
              <Popover open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-white bg-gray-700"
                    aria-label="Send feedback"
                  >
                    <MessageCircle className="size-4" />
                    Feedback
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  {success ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-green-700 font-medium text-center">
                        Your feedback was sent :)<br />We'll get in touch soon.
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setSuccess(false); setFeedbackOpen(false); }}>
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
                      <Textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Let us know your thoughts..."
                        minLength={3}
                        maxLength={2000}
                        required
                        className="resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Need help? <a href="mailto:dev@plandalf.com" className="underline">Contact us</a></span>
                        {/*or <a href="/docs" className="underline">see docs</a>*/}
                        <Button
                          type="submit"
                          size="sm"
                          disabled={submitting || feedback.length < 3}
                          className="ml-2"
                        >
                          {submitting ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
                    </form>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-1">
                    <UserInfo user={auth.user} />
                    <ChevronsUpDown className="ml-auto size-4" />
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="end"
                side={'bottom'}
              >
                <UserMenuContent user={auth.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <SidebarProvider defaultOpen={true} open={true} >
          {children}
        </SidebarProvider>
      </div>
    );
}
