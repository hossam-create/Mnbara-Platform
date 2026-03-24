# CSS Modules Configuration

This document explains the CSS Modules setup for the @mnbara/ui-components package.

## Overview

CSS Modules are configured using Vite as the build tool, providing scoped styling for all components. This ensures that styles are locally scoped by default, preventing style conflicts across the application.

## Configuration

### Build Setup

The package uses Vite with the following plugins:
- `@vitejs/plugin-react` - React support
- `vite-plugin-dts` - TypeScript declaration generation
- `vite-plugin-css-injected-by-js` - Injects CSS into JS bundle

### CSS Module Settings

```typescript
css: {
  modules: {
    localsConvention: 'camelCase',
    generateScopedName: '[name]__[local]___[hash:base64:5]',
  },
}
```

- **localsConvention**: Converts CSS class names to camelCase for JavaScript imports
- **generateScopedName**: Generates unique class names with component name, local name, and hash

## Usage

### Creating a CSS Module

1. Create a `.module.css` file next to your component:
```
Button.tsx
Button.module.css
```

2. Define your styles:
```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
}

.primary {
  background-color: #2563eb;
  color: white;
}
```

3. Import and use in your component:
```tsx
import styles from './Button.module.css';

export const Button = ({ variant = 'primary' }) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      Click me
    </button>
  );
};
```

### Class Name Conventions

CSS Modules automatically converts class names:
- `button-primary` → `styles.buttonPrimary`
- `card-header` → `styles.cardHeader`

### Combining Classes

```tsx
// Using template literals
<div className={`${styles.card} ${styles.elevated}`} />

// Using classnames library (recommended)
import classNames from 'classnames';
<div className={classNames(styles.card, styles.elevated)} />

// Using array join
<div className={[styles.card, styles.elevated].join(' ')} />
```

## Available Components with CSS Modules

The following components have CSS module files:

1. **Button.module.css** - Button component styles
   - Variants: primary, secondary, success, danger, warning, ghost, link
   - Sizes: sm, md, lg
   - States: loading, disabled, fullWidth

2. **Input.module.css** - Input component styles
   - Sizes: sm, md, lg
   - States: error, success, disabled
   - Features: label, helperText, errorMessage, icon support

3. **Card.module.css** - Card component styles
   - Variants: elevated, outlined, flat
   - Sections: header, body, footer
   - Features: hoverable, padding variants

4. **Modal.module.css** - Modal component styles
   - Sizes: sm, md, lg, xl, full
   - Sections: header, body, footer
   - Features: overlay, animations, scrollable

5. **Badge.module.css** - Badge component styles
   - Variants: default, primary, success, warning, danger, info
   - Sizes: sm, md, lg
   - Features: dot indicator, removable

6. **Spinner.module.css** - Spinner component styles
   - Sizes: sm, md, lg, xl
   - Variants: primary, secondary, success, danger, warning, white
   - Features: centered, with label

7. **Skeleton.module.css** - Skeleton component styles
   - Variants: text, title, circle, rectangle, button
   - Sizes: sm, md, lg, xl
   - Features: width variants, avatar sizes, card skeleton

## TypeScript Support

TypeScript declarations for CSS modules are defined in `src/css-modules.d.ts`:

```typescript
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

This provides type safety and autocomplete for CSS module imports.

## Build Output

When building the package:
1. CSS is processed and scoped
2. CSS is injected into the JavaScript bundle
3. TypeScript declarations are generated
4. Both ESM and CJS formats are produced

## Best Practices

1. **Use semantic class names**: Name classes based on purpose, not appearance
   ```css
   /* Good */
   .submitButton { }
   .errorMessage { }
   
   /* Avoid */
   .redButton { }
   .smallText { }
   ```

2. **Keep specificity low**: Avoid nesting and complex selectors
   ```css
   /* Good */
   .button { }
   .buttonPrimary { }
   
   /* Avoid */
   .card .header .button.primary { }
   ```

3. **Use composition**: Combine multiple classes instead of creating variants
   ```tsx
   <button className={`${styles.button} ${styles.primary} ${styles.large}`} />
   ```

4. **Avoid global styles**: Keep all styles scoped to modules
   ```css
   /* Avoid */
   :global(.button) { }
   
   /* Use module classes instead */
   .button { }
   ```

## Migration from Inline Styles

If you have components using inline styles or Tailwind classes, migrate to CSS modules:

**Before:**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>
```

**After:**
```tsx
import styles from './Button.module.css';

<button className={styles.button}>
  Click me
</button>
```

## Testing

CSS modules work seamlessly with Jest and React Testing Library:

```tsx
import { render } from '@testing-library/react';
import { Button } from './Button';

test('applies correct classes', () => {
  const { container } = render(<Button variant="primary" />);
  const button = container.querySelector('button');
  
  // CSS modules generate unique class names
  expect(button?.className).toContain('Button__button');
  expect(button?.className).toContain('Button__primary');
});
```

## Troubleshooting

### Class names not applying
- Ensure you're importing from `.module.css` files
- Check that the CSS file is in the same directory as the component
- Verify the class name exists in the CSS module

### TypeScript errors
- Make sure `css-modules.d.ts` is included in your tsconfig
- Restart your TypeScript server

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that vite.config.ts is properly configured
- Clear the dist folder and rebuild

## Resources

- [Vite CSS Modules Documentation](https://vitejs.dev/guide/features.html#css-modules)
- [CSS Modules Specification](https://github.com/css-modules/css-modules)
- [React CSS Modules Guide](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/)
