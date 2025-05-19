import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export interface PublishStatusCardProps {
  isPublished: boolean;
}

export function PublishStatusCard({ isPublished }: PublishStatusCardProps) {
  return (

    <div className={cn(
      "w-full p-6 flex flex-row gap-2 items-center rounded-md shadow-sm",
      isPublished ? 'bg-lime-100 border border-lime-500 text-green-900' : 'bg-red-100 border border-red-500 text-red-900'
    )}>
      {isPublished ? (
        <CheckCircle className="size-6" />
      ) : (
        <AlertCircle className="size-6" />
      )}
      {isPublished ? 'Your experience is ready to share' : 'You have unsaved changes'}
    </div>
  );
}
