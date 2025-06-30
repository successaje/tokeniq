# TokenIQ Theme Components

A collection of theme-aware UI components for the TokenIQ application. These components are designed to work seamlessly with both light and dark themes, with automatic theme detection and switching.

## Installation

These components are part of the TokenIQ UI library and are automatically available when importing from `@/components/theme`.

## Components

### ThemeProviderWrapper

The root component that provides theme context to all child components. Should be placed at the root of your application.

```tsx
import { ThemeProviderWrapper } from '@/components/theme';

function App() {
  return (
    <ThemeProviderWrapper>
      <YourApp />
    </ThemeProviderWrapper>
  );
}
```

### Theme Variables

Utility functions for working with theme variables and colors.

```tsx
import { useThemeColors, useColorMode } from '@/components/theme';

function Example() {
  const colors = useThemeColors();
  const { isDark, colorMode } = useColorMode();
  
  return (
    <div style={{ color: colors.primary }}>
      Current theme: {colorMode}
    </div>
  );
}
```

### Theme Components

#### ThemeButton

A theme-aware button component with built-in variants and theming support.

```tsx
import { ThemeButton, PrimaryButton, SecondaryButton } from '@/components/theme';

function Example() {
  return (
    <div>
      <ThemeButton variant="primary">Primary</ThemeButton>
      <PrimaryButton>Primary (convenience)</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
    </div>
  );
}
```

#### ThemeCard

A theme-aware card component with multiple variants and theming support.

```tsx
import { ThemeCard, CardHeader, CardTitle, CardContent } from '@/components/theme';

function Example() {
  return (
    <ThemeCard>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        Card content goes here
      </CardContent>
    </ThemeCard>
  );
}
```

#### ThemeText

A theme-aware text component with semantic variants and theming support.

```tsx
import { H1, H2, P } from '@/components/theme';

function Example() {
  return (
    <div>
      <H1>Heading 1</H1>
      <H2>Heading 2</H2>
      <P>Paragraph text</P>
    </div>
  );
}
```

#### ThemeImage

A theme-aware image component that automatically switches between light and dark variants.

```tsx
import { ThemeImage } from '@/components/theme';

function Example() {
  return (
    <ThemeImage
      lightSrc="/logo-light.png"
      darkSrc="/logo-dark.png"
      alt="Logo"
      width={200}
      height={50}
    />
  );
}
```

## Theming

### Theme Variables

The theme system uses CSS variables for theming. Here are the default theme variables:

```css
:root {
  /* Light theme colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  /* Dark theme colors */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### Customizing Themes

You can customize the theme by overriding these CSS variables in your global CSS file:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... */
}
```

## Best Practices

1. **Use Theme Components**: Always use theme components instead of raw HTML elements to ensure consistent theming.
2. **Theme-Aware Styling**: Use the `useThemeColors` hook to access theme colors in your components.
3. **Responsive Design**: Use Tailwind's responsive prefixes to adjust styles based on screen size.
4. **Accessibility**: Ensure proper color contrast and use semantic HTML elements.
5. **Performance**: Use the `ThemeImage` component for theme-aware images to avoid loading both light and dark variants.

## Development

### Adding New Components

When adding new theme-aware components:

1. Create a new file in the `src/components/theme` directory.
2. Use the `useTheme` hook to access the current theme.
3. Export the component from `src/components/theme/index.ts`.
4. Add documentation to this README.

### Testing

Test your components in both light and dark themes to ensure they work as expected. Use the theme toggle in the UI to switch between themes during development.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
