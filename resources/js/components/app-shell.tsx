import { SidebarProvider } from '@/components/ui/sidebar';
import React, { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';
import { AlertCircleIcon } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { MessageCircle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';
import { ImageUpload } from './ui/image-upload';
import { OnboardingProgress } from '@/components/onboarding-progress';


interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  

  const organization = useCurrentOrganization();

  // Feedback popover state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [image, setImage] = useState<{ id: number, url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/feedback', { feedback, imageUrl: image?.url });
      setSuccess(true);
      setFeedback('');
      setImage(null);
    } catch {
      setError('Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onPopupChange = (status: boolean) => {
    setFeedbackOpen(status);
    if(!status) {
      setSuccess(false);
      setError(null);
      setFeedback('');
      setImage(null);
    }
  };

  return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 text-white flex justify-between items-center px-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" prefetch>
              <AppLogo />
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6">
              <OnboardingProgress />
              {
                organization?.on_trial && (
                  <Link href="/organizations/settings/billing" className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-medium hover:bg-yellow-200 font-semibold flex items-center gap-1">
                    <AlertCircleIcon className="size-4" /> {organization?.trial_days_left} day{Number(organization?.trial_days_left) === 1 ? '' : 's'} trial left
                  </Link>
                )
              }
              <Popover open={feedbackOpen} onOpenChange={onPopupChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="dark-outline"
                    size="sm"
                    className="flex items-center gap-1 "
                    aria-label="Send feedback"
                  >
                    <MessageCircle className="size-4" />
                    Feedback
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  {success ? (
                    <div className="flex flex-col items-center gap-5">
                      <div className="text-green-700 font-medium text-center">
                        Your feedback was sent :)<br />We'll get in touch soon.
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setSuccess(false); onPopupChange(false); }}>
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
                      <ImageUpload
                        preview={image?.url}
                        onChange={setImage}
                        label="Attach an image"
                        buttonClassName="text-gray-500"
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


          </div>
        </div>
        <div className="pt-14">
          <SidebarProvider defaultOpen={true} open={true} >
            {children}
          </SidebarProvider>
        </div>
      </div>
    );
}
