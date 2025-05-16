import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (search: string) => void;
  className?: string;
  inputClassName?: string;
}

export default function SearchBar({ placeholder, value, onChange, className, inputClassName }: SearchBarProps) {
  return (
    <div className={cn("relative mb-4", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input 
        className={cn("pl-10 h-10 rounded-lg", inputClassName)}
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
  </div>
  );
}
