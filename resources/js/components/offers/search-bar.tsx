import { Search } from "lucide-react";
import { Input } from "../ui/input";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (search: string) => void;
}

export default function SearchBar({ placeholder, value, onChange }: SearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input 
        className="pl-10 h-10 rounded-lg"
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
  </div>
  );
}
