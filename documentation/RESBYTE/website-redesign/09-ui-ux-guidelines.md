# UI/UX Guidelines

## Overview

This document outlines the UI/UX guidelines for the redesigned Resbyte.ai project management platform. It provides a consistent framework for design decisions across all components of the application, ensuring a cohesive and intuitive user experience.

## Design Principles

### 1. Clarity

- Prioritize content hierarchy with clear visual distinction
- Use straightforward language and intuitive iconography
- Provide contextual help and guidance
- Maintain consistent patterns across the platform

### 2. Efficiency

- Minimize clicks for common tasks
- Provide keyboard shortcuts for power users
- Use progressive disclosure for complex features
- Optimize information density for different contexts

### 3. Flexibility

- Support different user roles and workflows
- Allow customization of views and dashboards
- Provide multiple paths to accomplish tasks
- Scale gracefully across device sizes

### 4. Consistency

- Maintain visual consistency across all components
- Use standardized interaction patterns
- Apply consistent terminology throughout
- Ensure predictable behavior for similar actions

### 5. Feedback

- Provide clear feedback for all user actions
- Communicate system status and changes
- Use appropriate loading indicators
- Confirm successful completion of tasks

## Visual Design

### Color Palette

#### Primary Colors

- **Primary Blue**: #3B82F6 (rgb(59, 130, 246))
  - Hover: #2563EB (rgb(37, 99, 235))
  - Active: #1D4ED8 (rgb(29, 78, 216))

- **Primary Text**: #1F2937 (rgb(31, 41, 55))
  - Secondary Text: #4B5563 (rgb(75, 85, 99))
  - Tertiary Text: #9CA3AF (rgb(156, 163, 175))

#### Secondary Colors

- **Success Green**: #10B981 (rgb(16, 185, 129))
- **Warning Amber**: #F59E0B (rgb(245, 158, 11))
- **Error Red**: #EF4444 (rgb(239, 68, 68))
- **Info Blue**: #60A5FA (rgb(96, 165, 250))

#### Neutral Colors

- **Background**: #FFFFFF (rgb(255, 255, 255))
- **Surface**: #F9FAFB (rgb(249, 250, 251))
- **Border**: #E5E7EB (rgb(229, 231, 235))
- **Divider**: #F3F4F6 (rgb(243, 244, 246))

### Typography

#### Font Family

- **Primary Font**: Inter, system-ui, sans-serif
- **Monospace Font**: JetBrains Mono, monospace (for code snippets)

#### Font Sizes

- **Heading 1**: 2rem (32px), weight: 700
- **Heading 2**: 1.5rem (24px), weight: 700
- **Heading 3**: 1.25rem (20px), weight: 600
- **Heading 4**: 1.125rem (18px), weight: 600
- **Body**: 1rem (16px), weight: 400
- **Small**: 0.875rem (14px), weight: 400
- **Caption**: 0.75rem (12px), weight: 400

#### Line Heights

- **Headings**: 1.2
- **Body Text**: 1.5
- **Tight Text**: 1.25

### Spacing System

- **4px**: Extra small spacing (0.25rem)
- **8px**: Small spacing (0.5rem)
- **12px**: Medium-small spacing (0.75rem)
- **16px**: Base spacing (1rem)
- **24px**: Medium spacing (1.5rem)
- **32px**: Large spacing (2rem)
- **48px**: Extra large spacing (3rem)
- **64px**: 2x large spacing (4rem)

### Iconography

- **Style**: Outlined, consistent stroke width
- **Size**: 20px for inline, 24px for standalone
- **Library**: Lucide icons
- **Usage**: Always provide text labels for important actions
- **Color**: Match text color or use primary color for emphasis

### Shadows

- **Small**: 0 1px 2px rgba(0, 0, 0, 0.05)
- **Medium**: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- **Large**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **Extra Large**: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

### Border Radius

- **Small**: 0.25rem (4px)
- **Medium**: 0.375rem (6px)
- **Large**: 0.5rem (8px)
- **Extra Large**: 0.75rem (12px)
- **Full**: 9999px (for pills and avatars)

## Component Guidelines

### Cards

- Use for discrete content blocks
- Maintain consistent padding (16px or 24px)
- Include clear headings
- Use subtle shadows for elevation
- Provide hover states for interactive cards

```
┌─────────────────────────────────┐
│ [Icon] Card Title               │
├─────────────────────────────────┤
│                                 │
│ Card content goes here with     │
│ consistent padding and spacing. │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Buttons

- **Primary**: Filled background, white text
- **Secondary**: Outlined, colored text
- **Tertiary**: No background or border, colored text
- **Destructive**: Red background or text
- Always include hover and active states
- Maintain consistent padding and height
- Include loading states for async actions

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Primary   │  │ Secondary  │  │  Tertiary  │
└────────────┘  └────────────┘  └────────────┘
```

### Forms

- Group related fields
- Provide clear labels above fields
- Show validation errors inline
- Use helper text for additional context
- Maintain consistent field heights
- Support keyboard navigation

```
Label
┌────────────────────────────────┐
│ Input text                     │
└────────────────────────────────┘
Helper text or error message
```

### Tables

- Use zebra striping for better readability
- Include hover states for rows
- Provide sorting and filtering capabilities
- Support pagination for large datasets
- Allow column customization
- Include empty and loading states

```
┌────────┬────────────┬────────────┬────────────┐
│ Header │ Header     │ Header     │ Header     │
├────────┼────────────┼────────────┼────────────┤
│ Cell   │ Cell       │ Cell       │ Cell       │
├────────┼────────────┼────────────┼────────────┤
│ Cell   │ Cell       │ Cell       │ Cell       │
└────────┴────────────┴────────────┴────────────┘
```

### Navigation

- Highlight current section
- Use consistent iconography
- Provide clear labels
- Support keyboard navigation
- Consider collapsible navigation for mobile
- Include breadcrumbs for deep hierarchies

```
┌────────────────────────────────┐
│ [Icon] Navigation Item         │
│ [Icon] Active Item             │
│ [Icon] Navigation Item         │
│ [Icon] Navigation Item         │
└────────────────────────────────┘
```

### Dialogs and Modals

- Use for focused tasks and confirmations
- Include clear titles and actions
- Provide escape mechanisms (close button, ESC key)
- Maintain focus within the modal
- Consider size and placement for different content
- Implement proper keyboard navigation

```
┌────────────────────────────────┐
│ Dialog Title            [X]    │
├────────────────────────────────┤
│                                │
│ Dialog content goes here.      │
│                                │
│                                │
├────────────────────────────────┤
│ [Secondary]         [Primary]  │
└────────────────────────────────┘
```

### Notifications

- Use consistent positioning (typically top-right)
- Include appropriate icons for different types
- Provide clear, concise messages
- Include dismiss options
- Consider auto-dismiss for non-critical notifications
- Support stacking for multiple notifications

```
┌────────────────────────────────┐
│ [Icon] Notification message [X]│
└────────────────────────────────┘
```

## Interaction Patterns

### Loading States

- Use skeleton loaders for content
- Show progress indicators for long operations
- Provide feedback for background processes
- Disable interactive elements during loading
- Consider optimistic UI updates where appropriate

### Empty States

- Provide helpful guidance
- Include illustrations or icons
- Offer actions to fill the empty state
- Maintain consistent styling with the rest of the UI
- Consider first-time user experience

### Error States

- Clearly communicate what went wrong
- Provide actionable solutions
- Use appropriate error styling
- Consider inline errors for form validation
- Include recovery options when possible

### Transitions and Animations

- Use subtle animations for state changes
- Keep transitions short (150-300ms)
- Ensure animations don't block interaction
- Consider reduced motion preferences
- Use consistent easing functions

## Responsive Design

### Breakpoints

- **Small**: 640px and below
- **Medium**: 641px to 768px
- **Large**: 769px to 1024px
- **Extra Large**: 1025px to 1280px
- **2x Large**: 1281px and above

### Layout Adjustments

- Single column layouts on small screens
- Simplified navigation on mobile (hamburger menu)
- Adjusted card grids based on screen size
- Collapsible sections for complex content
- Touch-friendly tap targets (minimum 44x44px)

### Content Prioritization

- Focus on essential information on small screens
- Progressive disclosure for secondary content
- Consider different information hierarchies per device
- Maintain access to all features across devices
- Optimize for the primary use case of each screen size

## Accessibility Guidelines

### Color and Contrast

- Maintain minimum contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Provide sufficient contrast between adjacent colors
- Test with color blindness simulators
- Support both light and dark modes

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Provide visible focus indicators
- Implement logical tab order
- Support standard keyboard shortcuts
- Allow keyboard shortcuts to be customized

### Screen Readers

- Include proper ARIA attributes
- Provide alternative text for images
- Use semantic HTML elements
- Create accessible forms with proper labels
- Test with screen readers

### Motion and Animation

- Respect reduced motion preferences
- Avoid flashing content
- Ensure animations don't interfere with usability
- Provide alternatives for motion-based interactions
- Allow users to pause or disable animations

## Implementation with Tailwind CSS

### Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          active: '#1D4ED8',
        },
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          tertiary: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Component Examples

#### Button Component

```tsx
// Button.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active',
    secondary: 'border border-primary text-primary hover:bg-primary/5 active:bg-primary/10',
    tertiary: 'text-primary hover:bg-primary/5 active:bg-primary/10',
    destructive: 'bg-error text-white hover:bg-error/90 active:bg-error/80',
  };

  const sizeClasses = {
    sm: 'text-sm py-1 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!isLoading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};
```

#### Card Component

```tsx
// Card.tsx
import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  className = '',
  actions,
}) => {
  return (
    <div className={`
      bg-white rounded-lg shadow-md overflow-hidden
      border border-border
      ${className}
    `}>
      {(title || icon || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center">
            {icon && <div className="mr-3">{icon}</div>}
            {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
```

## Next Steps

1. Create a comprehensive component library based on these guidelines
2. Implement design tokens for consistent styling
3. Develop responsive layouts for all major views
4. Create interactive prototypes for user testing
5. Establish a design system documentation site
6. Implement accessibility testing and improvements
