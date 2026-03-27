# Integration Guide: Using @mnbara/ui-components

This guide explains how to integrate and use the @mnbara/ui-components package in your application.

## Installation

```bash
npm install @mnbara/ui-components
```

## Setup

### 1. Vite Configuration (Recommended)

If you're using Vite, CSS modules are supported out of the box. No additional configuration needed.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // CSS modules work automatically
});
```

### 2. Webpack Configuration

For webpack-based projects (Create React App, Next.js, etc.):

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]',
              },
            },
          },
        ],
      },
    ],
  },
};
```

### 3. Next.js Configuration

Next.js supports CSS modules by default. No configuration needed.

## Usage

### Basic Import

```tsx
import { Button, Input, Card } from '@mnbara/ui-components';

function App() {
  return (
    <Card>
      <Input placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

### Using with TypeScript

The package includes full TypeScript support:

```tsx
import { Button, ButtonProps } from '@mnbara/ui-components';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

### Styling Options

#### Option 1: Use Component Props (Recommended)

```tsx
<Button 
  variant="primary" 
  size="lg" 
  fullWidth 
  loading={isLoading}
>
  Submit
</Button>
```

#### Option 2: Custom CSS Classes

```tsx
// Your component
import { Button } from '@mnbara/ui-components';
import styles from './MyComponent.module.css';

<Button className={styles.customButton}>
  Custom Styled Button
</Button>
```

```css
/* MyComponent.module.css */
.customButton {
  /* Override or extend button styles */
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### Option 3: Inline Styles

```tsx
<Button style={{ marginTop: '1rem' }}>
  Button with margin
</Button>
```

## Component Examples

### Button

```tsx
import { Button } from '@mnbara/ui-components';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>

// With Icons
<Button icon={<Icon />} iconPosition="left">
  With Icon
</Button>
```

### Input

```tsx
import { Input } from '@mnbara/ui-components';

// Basic
<Input placeholder="Enter text" />

// With Label
<Input label="Email" type="email" required />

// Sizes
<Input size="sm" />
<Input size="md" />
<Input size="lg" />

// States
<Input error="This field is required" />
<Input disabled />
<Input helperText="Enter your email address" />
```

### Card

```tsx
import { Card } from '@mnbara/ui-components';

// Basic
<Card>
  <p>Card content</p>
</Card>

// Variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="flat">Flat Card</Card>

// With Sections
<Card>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Hoverable
<Card hoverable onClick={() => console.log('clicked')}>
  Clickable Card
</Card>
```

### Modal

```tsx
import { Modal } from '@mnbara/ui-components';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        size="md"
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Badge

```tsx
import { Badge } from '@mnbara/ui-components';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>

// With Dot
<Badge variant="success" dot>Active</Badge>

// Removable
<Badge 
  variant="primary" 
  onRemove={() => console.log('removed')}
>
  Removable
</Badge>
```

### Spinner

```tsx
import { Spinner } from '@mnbara/ui-components';

// Basic
<Spinner />

// Variants
<Spinner variant="primary" />
<Spinner variant="success" />
<Spinner variant="danger" />

// Sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />

// With Label
<Spinner label="Loading..." />

// Centered
<Spinner centered />
```

### Skeleton

```tsx
import { Skeleton } from '@mnbara/ui-components';

// Text
<Skeleton variant="text" />
<Skeleton variant="title" />

// Shapes
<Skeleton variant="circle" />
<Skeleton variant="rectangle" />
<Skeleton variant="button" />

// Sizes
<Skeleton size="sm" width="50%" />
<Skeleton size="md" width="75%" />
<Skeleton size="lg" width="100%" />

// Avatar
<Skeleton variant="circle" size="avatarMd" />

// Card Skeleton
<Skeleton variant="card">
  <Skeleton variant="title" />
  <Skeleton variant="text" />
  <Skeleton variant="text" width="80%" />
</Skeleton>
```

## Theming

### Custom Theme

You can override CSS variables to customize the theme:

```css
/* Your global CSS */
:root {
  --mnbara-primary: #2563eb;
  --mnbara-secondary: #6b7280;
  --mnbara-success: #16a34a;
  --mnbara-danger: #dc2626;
  --mnbara-warning: #eab308;
  
  --mnbara-border-radius: 0.375rem;
  --mnbara-font-family: 'Inter', sans-serif;
}
```

### Dark Mode

```css
/* Dark mode overrides */
[data-theme="dark"] {
  --mnbara-bg-primary: #1f2937;
  --mnbara-text-primary: #f9fafb;
  --mnbara-border-color: #374151;
}
```

## Best Practices

1. **Use TypeScript**: Take advantage of full type safety
2. **Compose Components**: Build complex UIs by composing simple components
3. **Consistent Sizing**: Use the size prop consistently across components
4. **Accessibility**: Components include ARIA attributes, but add more as needed
5. **Performance**: Components are tree-shakeable, only import what you need

## Troubleshooting

### Styles not applying

1. Ensure your bundler supports CSS modules
2. Check that you're importing from `@mnbara/ui-components`
3. Verify no conflicting global styles

### TypeScript errors

1. Make sure `@types/react` is installed
2. Check your tsconfig.json includes the package
3. Restart your TypeScript server

### Build errors

1. Clear node_modules and reinstall
2. Check for peer dependency conflicts
3. Ensure you're using Node.js 18+

## Support

For issues and questions:
- GitHub Issues: [mnbara-platform/issues](https://github.com/mnbara-platform/issues)
- Documentation: [docs.mnbara.com](https://docs.mnbara.com)
- Email: support@mnbara.com
