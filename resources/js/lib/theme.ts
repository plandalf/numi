import { Theme } from "@/types/theme";

/**
 * Resolves a theme value by checking:
 * 1. If value is empty/null/undefined, returns the default from theme
 * 2. If value is an empty object, returns the default from theme
 * 3. If value is a string containing theme variable ({{theme.property}}), resolves it
 * 4. Otherwise returns the original value maintaining its type
 * 
 * @param value The current value to resolve (can be any type)
 * @param theme The theme object to get values from
 * @param defaultThemeKey The theme property key to use as default
 * @returns The resolved value maintaining its original type when possible
 */
export function resolveThemeValue<T>(
  value: T,
  theme: Theme | null | undefined,
  defaultThemeKey?: keyof Theme
): T | unknown {
  // Handle null/undefined with default theme value
  if (value == null && defaultThemeKey) {
    return theme?.[defaultThemeKey] ?? null;
  }

  // Handle empty objects with default theme value
  if (
    typeof value === 'object' && 
    value !== null && 
    !Array.isArray(value) && 
    Object.keys(value).length === 0 && 
    defaultThemeKey
  ) {
    return theme?.[defaultThemeKey] ?? value;
  }

  // Only process string values for theme variable substitution
  if (typeof value === 'string') {
    // If empty string and default key provided, return theme default
    if (!value.trim() && defaultThemeKey) {
      return theme?.[defaultThemeKey] ?? value;
    }

    // Check for theme variable pattern {{theme.property}}
    const themeVarMatch = value.match(/{{theme\.([a-zA-Z_]+)}}/);
    if (themeVarMatch?.[1]) {
      const themeProperty = themeVarMatch[1] as keyof Theme;
      return theme?.[themeProperty] ?? value;
    }
  }

  // Return original value for all other types
  return value;
}
