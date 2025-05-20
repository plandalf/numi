import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";

interface RedirectToUrlProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function RedirectToUrl({ value = '', onChange }: RedirectToUrlProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Label className="text-sm font-semibold">Options</Label>
      <div className="flex flex-row gap-4 items-center w-full">
        <Label className="text-sm w-16">URL</Label>
        <Input
          className="bg-white w-[300px]"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter URL"
        />
      </div>
    </div>
  );
}
