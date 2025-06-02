import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OrigamiIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import axios from '@/lib/axios';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { ImageUpload } from '../ui/image-upload';

export interface TemplateRequestBannerProps {
    className?: string;
}

export function TemplateRequestBanner({ className }: TemplateRequestBannerProps) {
    // Template request popover state
    const [requestTemplateOpen, setRequestTemplateOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<{ id: number, url: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      try {
        await axios.post('/templates/request', { description, imageUrl: image?.url });
        setSuccess(true);
        setDescription('');
        setImage(null);
      } catch {
        setError('Could not send feedback. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };


    const onPopupChange = (status: boolean) => {
        setRequestTemplateOpen(status);
        if(!status) {
          setSuccess(false);
          setError(null);
          setDescription('');
          setImage(null);
        }
      };
    
    return (
        <Card className={cn("bg-cyan-600 text-white p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <OrigamiIcon className="h-8 w-8" />
                    <div>
                        <h2 className="text-xl font-semibold">Request a Template</h2>
                        <p className="text-blue-100">We'll build any design you can imagine within a week</p>
                    </div>
                </div>
                <Popover open={requestTemplateOpen} onOpenChange={onPopupChange}>
                <PopoverTrigger asChild>
                    <Button variant="secondary" className="bg-white text-blue-500 hover:bg-blue-50">
                        Request
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  {success ? (
                    <div className="flex flex-col items-center gap-5">
                      <div className="text-green-700 font-medium text-center">
                        Your template request was sent! <br />We'll get in touch soon.
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => { setSuccess(false); setRequestTemplateOpen(false); }}>
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
                      <Textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe your template request..."
                        minLength={3}
                        maxLength={2000}
                        rows={5}
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
                        <Button
                          type="submit"
                          size="sm"
                          disabled={submitting || description.length < 3}
                          className="w-full"
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
        </Card>
    );
} 