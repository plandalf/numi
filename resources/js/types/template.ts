import { Organization } from ".";
import { Theme } from "./theme";

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  theme_id: number | null;
  theme: Theme | null;
  organization_id: number | null;
  organization: Organization | null;
  view: any;
  preview_images: string[];
  created_at: string;
  updated_at: string;
} 