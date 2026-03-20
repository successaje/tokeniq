# TokenIQ Design System

## Overview
TokenIQ is designed as a world-class DeFi platform with a focus on Sei Network integration, featuring a clean, modern UI with consistent design patterns throughout.

## Color Palette

### Primary Colors (Sei Network)
- **Primary Purple**: `#8B5CF6` - Main brand color
- **Secondary Indigo**: `#6366F1` - Accent color
- **Light Purple**: `#A78BFA` - Subtle accents

### Semantic Colors
- **Success**: `#10B981` (Green) - Positive actions, gains
- **Warning**: `#F59E0B` (Amber) - Warnings, attention needed
- **Error**: `#EF4444` (Red) - Errors, losses
- **Info**: `#3B82F6` (Blue) - Information, neutral actions

### Gradients
- **Primary Gradient**: `from-purple-500/10 via-indigo-500/10 to-purple-500/10`
- **Text Gradient**: `from-purple-600 via-indigo-600 to-purple-600`
- **Button Gradient**: `from-purple-500 to-indigo-600`

## Typography

### Headings
- **H1**: `text-3xl md:text-4xl font-bold tracking-tight`
- **H2**: `text-2xl md:text-3xl font-bold tracking-tight`
- **H3**: `text-xl font-semibold`
- **H4**: `text-lg font-semibold`

### Body Text
- **Default**: `text-sm sm:text-base`
- **Muted**: `text-muted-foreground`
- **Small**: `text-xs text-muted-foreground`

## Layout

### Container
- **Max Width**: `max-w-[2000px]`
- **Padding**: `p-4 md:p-6`
- **Spacing**: Consistent `space-y-6` between sections

### Cards
- **Standard**: Rounded borders, subtle shadows
- **Elevated**: Enhanced shadows on hover
- **Gradient**: Purple/indigo gradient backgrounds for highlights

## Components

### Buttons
- **Primary**: Purple gradient with white text
- **Secondary**: Outline style with hover effects
- **Destructive**: Red variant for critical actions
- **Icon Buttons**: Consistent sizing and spacing

### Badges
- **Sei Network**: `bg-purple-500/10 text-purple-600 dark:text-purple-400`
- **AI Powered**: Outline variant with Sparkles icon
- **Status Badges**: Color-coded (green/amber/red)

### Charts
- **Colors**: Purple gradients for primary data
- **Grid**: Subtle dashed lines
- **Tooltips**: Consistent styling with brand colors
- **Responsive**: Full width with proper height ratios

### Modals/Dialogs
- **Wallet Modal**: Clean, focused transaction confirmation
- **Progress Indicators**: Animated spinners and progress bars
- **Success States**: Green checkmarks with clear messaging

## Sei Network Branding

### Badges
- "Powered by Sei Intelligence Layer" - Primary badge
- "Sei Network" - Secondary badge
- Sparkles icon for AI/Intelligence features

### Network Indicators
- Purple color scheme throughout
- Sei-specific metrics and data
- Sei vaults prominently featured

## Animation & Transitions

### Hover Effects
- Subtle scale transforms
- Color transitions
- Shadow enhancements

### Loading States
- Spinning loaders
- Skeleton screens
- Progress bars

### Page Transitions
- Smooth fade-ins
- Slide animations
- Staggered content reveals

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- Stack layouts on mobile
- Side-by-side on desktop
- Touch-friendly button sizes
- Readable text at all sizes

## Accessibility

### Color Contrast
- WCAG AA compliant
- Dark mode support
- High contrast text

### Interactive Elements
- Clear focus states
- Keyboard navigation
- Screen reader support

## Code Patterns

### Consistent Imports
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { SEI_BRANDING } from '@/config/sei-branding';
```

### Page Structure
```tsx
<div className="flex-1 p-4 md:p-6 max-w-[2000px] mx-auto w-full space-y-6">
  {/* Header with Sei badges */}
  {/* Summary cards */}
  {/* Main content */}
</div>
```

### Sei Branding Usage
```tsx
<Badge variant="outline" className="text-sm">
  <Sparkles className="h-3 w-3 mr-1" />
  {SEI_BRANDING.badges.intelligenceLayer}
</Badge>
```

## Best Practices

1. **Consistency**: Use shared components and design tokens
2. **Sei Focus**: Always highlight Sei Network features
3. **Clean UI**: White space and proper spacing
4. **Performance**: Optimize images and animations
5. **User Feedback**: Clear success/error states
6. **Responsive**: Test on all screen sizes
7. **Accessibility**: Ensure keyboard navigation works
8. **Dark Mode**: Support both light and dark themes

