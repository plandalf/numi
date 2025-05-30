import { useEditor } from '@/contexts/offer/editor-context';
import { cn } from '@/lib/utils';

export function PageIframePreview() {
  const { offer, previewSize } = useEditor();
  const offerUrl = offer.public_url;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-[90%] h-[95%] flex flex-col bg-background max-h-[95%]" style={{
      width: previewSize.width,
      height: previewSize.height,
    }}>
      {/* Browser-like header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
        {/* Browser controls */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* Address bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border border-border">
          <div className="w-4 h-4 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <span className="text-sm text-muted-foreground truncate">{offerUrl}</span>
        </div>
      </div>

      {/* Iframe container */}
      <div className="flex-1 relative">
        <iframe
          src={offerUrl}
          className="absolute inset-0 w-full h-full border-0"
          title="Offer Preview"
        />
      </div>
    </div>
    </div>
  );
}
