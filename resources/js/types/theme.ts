export interface ThemeColor {
  primary_color: string;
  primary_contrast_color: string;

  secondary_color: string;
  secondary_contrast_color: string;

  canvas_color: string;
  primary_surface_color: string;
  secondary_surface_color: string;

  label_text_color: string;
  body_text_color: string;

  primary_border_color: string;
  secondary_border_color: string;

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

  label_typography: string[];
  body_typography: string[];
}

export interface ThemeComponentStyling {
  border_radius: string;
  shadow: string;

  padding: string;
  spacing: string;
  margin: string;
}

export interface ThemeProperties extends ThemeColor, ThemeTypography, ThemeComponentStyling {};

export interface Theme extends ThemeProperties {
  id: string;
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
