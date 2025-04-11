export interface ThemeColorComponents {
  primary_color: string;
  secondary_color: string;
  canvas: string;
  primary_surface: string;
  secondary_surface: string;
  primary_border: string;
  secondary_border: string;
}

export interface ThemeColorText {
  dark_text: string;
  light_text: string;
}

export interface ThemeColorStatus {
  danger: string;
  info: string;
  warning: string;
  success: string;
  highlight: string;
}

export interface ThemeColor {
  components: ThemeColorComponents;
  text: ThemeColorText;
  status: ThemeColorText;
}

export interface ThemeTypographyDetail {
  size: string;
  font: string;
  weight: string;
}

export interface ThemeTypography {
  main_font: string;
  mono_font: string;
  h1: ThemeTypographyDetail;
  h2: ThemeTypographyDetail;
  h3: ThemeTypographyDetail;
  h4: ThemeTypographyDetail;
  h5: ThemeTypographyDetail;
  h6: ThemeTypographyDetail;
  label: ThemeTypographyDetail;
  body: ThemeTypographyDetail;
}

export interface ThemeComponents {
  border_radius: string;
  shadow_sm: string;
  shadow_md: string;
  shadow_lg: string;
}

export interface Theme {
  id: number;
  name: string;
  color: ThemeColor;
  typography: ThemeTypography;
  components: ThemeComponents;
  created_at: string;
  updated_at: string;
}

export enum Element {
  Object = 'object',
  Color = 'color',
  Size = 'size',
  Font = 'font',
  Weight = 'weight',
  Shadow = 'shadow'
}


// Visual representation of the theme properties
export interface ThemeProperty {
  name: string;
  type: Element;
  default: any;
  properties: ThemeProperty[];
}