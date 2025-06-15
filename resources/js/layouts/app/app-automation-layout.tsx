import { AppContent } from "@/components/app-content";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

// sidebar:
// history
// notes
// Runs
// Settings

interface Sequence {
  id: number;
  name: string;
  description?: string;
}

function AutomationHeader({ sequence }: { sequence: Sequence }) {
  return (
    <div className="border-sidebar-border/80 border-b bg-gray-900 flex justify-between h-14 items-center p-3 gap-x-4">
      <div className="flex gap-x-4 items-center min-w-0">
        <Link href="/dashboard" prefetch>
            <Button variant="outline" size="icon" className="flex-shrink-0 group">
                <ArrowLeft className="size-4 text-black group-hover:mr-1 transition-all" />
            </Button>
        </Link>

        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-lg font-bold text-white truncate">
              {sequence.name || 'Untitled Sequence'}
          </span>
        </div>
      </div>
      <h1>Automation</h1>
    </div>
  )
}

export default function AppAutomationLayout({ children, sequence }: { children: React.ReactNode; sequence: Sequence }) {
  return (
    <div>
      <AutomationHeader sequence={sequence} />
      <AppContent>
        {children}
      </AppContent>
    </div>
  );
}