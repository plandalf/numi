export interface ThemeColor {
  primary_color: string;
  secondary_color: string;
  canvas_color: string;
  primary_surface_color: string;
  secondary_surface_color: string;
  primary_border_color: string;
  secondary_border_color: string;
  light_text_color: string;
  dark_text_color: string;
  danger_color: string;
  info_color: string;
  warning_color: string;
  success_color: string;
  highlight_color: string;
}

export interface ThemeTypography {
  main_font: string;
  mono_font: string;
  h1_typography: string[];
  h2_typography: string[];
  h3_typography: string[];
  h4_typography: string[];
  h5_typography: string[];
  h6_typography: string[];
  label_typography: string[];
  body_typography: string[];
}

export interface ThemeComponentStyling {
  border_radius: string;
  shadow_sm: string;
  shadow_md: string;
  shadow_lg: string;
}

export interface Theme extends ThemeColor, ThemeTypography, ThemeComponentStyling {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export enum FieldType {
  Color = 'color',
  Typography = 'typography',
  Font = 'font',
  Size = 'size',
  Shadow = 'shadow'
}
