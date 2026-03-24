# @mnbara/ui-components

Shared UI component library for the Mnbara Platform.

## Overview

This package contains reusable React components used across the Mnbara Platform applications (web and mobile). All components are built with TypeScript and follow consistent design patterns.

## Installation

```bash
npm install @mnbara/ui-components
```

## Components

### Button
A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@mnbara/ui-components';

<Button variant="primary" size="medium" onClick={handleClick}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean

### Input
A form input component with validation support and multiple states.

```tsx
import { Input } from '@mnbara/ui-components';

// Basic usage
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={value}
  onChange={handleChange}
/>

// With validation states
<Input
  label="Username"
  validationState="success"
  helperText="Username is available"
/>

<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>

// Disabled and readonly states
<Input label="Email" value="user@example.com" disabled />
<Input label="ID" value="12345" readOnly />
```

**Props:**
- `label`: string - Label text for the input
- `type`: 'text' | 'email' | 'password' | 'number' | etc. - HTML input type
- `placeholder`: string - Placeholder text
- `value`: string - Input value
- `onChange`: (e: ChangeEvent) => void - Change handler
- `error`: string - Error message (sets validation state to error)
- `helperText`: string - Helper text displayed below input
- `validationState`: 'default' | 'error' | 'success' | 'warning' - Validation state
- `leftIcon`: ReactNode - Icon displayed on the left side
- `rightIcon`: ReactNode - Icon displayed on the right side
- `fullWidth`: boolean - Makes input take full width of container
- `disabled`: boolean - Disables the input
- `readOnly`: boolean - Makes input read-only
- `required`: boolean - Shows required indicator (*)

### Card
A flexible container component with composable slots for grouping related content.

```tsx
import { Card } from '@mnbara/ui-components';

// Basic card
<Card>
  <Card.Body>Simple card content</Card.Body>
</Card>

// Card with all slots
<Card variant="elevated" hover>
  <Card.Header 
    title="Card Title" 
    subtitle="Card subtitle"
    action={<Button size="sm">Edit</Button>}
  />
  <Card.Body>
    <p>Main content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Card.Actions align="right">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </Card.Actions>
  </Card.Footer>
</Card>

// Card with custom header
<Card variant="outlined">
  <Card.Header bordered={false}>
    <div className="flex items-center gap-3">
      <Avatar src={user.avatar} />
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  </Card.Header>
  <Card.Body>User profile content</Card.Body>
</Card>

// Clickable card
<Card hover onClick={handleCardClick}>
  <Card.Body>
    <h3>Clickable Card</h3>
    <p>This entire card is clickable</p>
  </Card.Body>
</Card>
```

**Card Props:**
- `variant`: 'default' | 'outlined' | 'elevated' - Visual style variant
- `hover`: boolean - Adds hover effect with shadow
- `padding`: boolean - Adds padding to the card container
- `fullWidth`: boolean - Makes card take full width
- `className`: string - Additional CSS classes

**Card.Header Props:**
- `title`: string - Header title text
- `subtitle`: string - Header subtitle text
- `action`: ReactNode - Action element (e.g., button) displayed on the right
- `bordered`: boolean - Shows bottom border (default: true)
- `children`: ReactNode - Custom header content
- `className`: string - Additional CSS classes

**Card.Body Props:**
- `children`: ReactNode - Body content (required)
- `padding`: boolean - Applies padding (default: true)
- `className`: string - Additional CSS classes

**Card.Footer Props:**
- `children`: ReactNode - Footer content (required)
- `bordered`: boolean - Shows top border (default: true)
- `align`: 'left' | 'center' | 'right' - Content alignment (default: 'left')
- `className`: string - Additional CSS classes

**Card.Actions Props:**
- `children`: ReactNode - Action buttons (required)
- `align`: 'left' | 'center' | 'right' - Alignment (default: 'right')
- `spacing`: 'sm' | 'md' | 'lg' - Space between actions (default: 'md')
- `className`: string - Additional CSS classes

### Modal
A modal dialog component with portal rendering.

```tsx
import { Modal } from '@mnbara/ui-components';

<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>Modal Title</Modal.Header>
  <Modal.Body>Modal content</Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>Close</Button>
  </Modal.Footer>
</Modal>
```

### Badge
A badge component for displaying status or counts.

```tsx
import { Badge } from '@mnbara/ui-components';

<Badge variant="success">Active</Badge>
<Badge variant="warning" count={5} />
```

**Props:**
- `variant`: 'success' | 'warning' | 'error' | 'info' | 'default'
- `count`: number

### Spinner
A loading spinner component.

```tsx
import { Spinner } from '@mnbara/ui-components';

<Spinner size="medium" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `color`: string

### Skeleton
A skeleton loading placeholder component.

```tsx
import { Skeleton } from '@mnbara/ui-components';

<Skeleton width="100%" height="20px" />
<Skeleton.Text lines={3} />
<Skeleton.Circle size="50px" />
```

## Development

### Storybook

View and interact with all components in Storybook:

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006` where you can:
- Browse all components and their variants
- Test component props interactively
- View auto-generated documentation
- Check accessibility compliance
- Copy code examples

Build static Storybook for deployment:

```bash
npm run build-storybook
```

See [STORYBOOK.md](./STORYBOOK.md) for detailed Storybook documentation.

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:watch
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Usage in Applications

### Web Application

```tsx
import { Button, Input, Card } from '@mnbara/ui-components';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

### Mobile Application

The components are designed to work with React Native as well, with appropriate styling adaptations.

## Styling

Components use **CSS Modules** for styling, providing scoped styles with zero conflicts. Each component has its own `.module.css` file that can be customized through props or by overriding CSS classes.

### CSS Modules Configuration

The package is built with Vite and includes full CSS Modules support:
- **Scoped class names** - Automatically generated unique class names
- **Type safety** - TypeScript declarations for CSS imports
- **Performance** - Optimized CSS output with tree-shaking
- **Flexibility** - Easy to override and extend styles

### Available CSS Module Files

- `Button.module.css` - Button component styles
- `Input.module.css` - Input component styles
- `Card.module.css` - Card component styles
- `Modal.module.css` - Modal component styles
- `Badge.module.css` - Badge component styles
- `Spinner.module.css` - Spinner component styles
- `Skeleton.module.css` - Skeleton component styles

### Custom Styling

You can override component styles using CSS modules in your application:

```tsx
import { Button } from '@mnbara/ui-components';
import styles from './MyComponent.module.css';

<Button className={styles.customButton}>
  Custom Styled Button
</Button>
```

```css
/* MyComponent.module.css */
.customButton {
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Documentation

- [CSS Modules Guide](./CSS_MODULES.md) - Detailed CSS Modules documentation
- [Integration Guide](./INTEGRATION_GUIDE.md) - How to integrate in your project
- [Modal Usage Guide](./MODAL_USAGE.md) - Modal component examples

## Contributing

When adding new components:

1. Create the component in `src/ComponentName.tsx`
2. Add TypeScript types for all props
3. Export the component from `src/index.ts`
4. Write unit tests
5. Update this README with usage examples

## License

MIT
