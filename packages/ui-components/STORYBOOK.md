# Storybook Documentation

This package includes Storybook stories for all UI components, providing interactive documentation and visual testing.

## Running Storybook

To start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`

## Building Storybook

To build a static version of Storybook:

```bash
npm run build-storybook
```

The static files will be generated in the `storybook-static` directory.

## Available Stories

### Button Component
- **Location:** `src/Button.stories.tsx`
- **Variants:** Primary, Secondary, Success, Danger, Warning, Ghost, Link
- **Sizes:** Small, Medium, Large
- **States:** Loading, Disabled, Full Width, With Icons

### Input Component
- **Location:** `src/Input.stories.tsx`
- **Features:** Labels, Helper Text, Error Messages, Icons
- **Validation States:** Default, Error, Success, Warning
- **Types:** Text, Email, Password, Number
- **States:** Disabled, Read-only, Required

### Card Component
- **Location:** `src/Card.stories.tsx`
- **Variants:** Default, Outlined, Elevated
- **Composable Parts:** Header, Body, Footer, Actions
- **Features:** Hover effects, Padding options, Full width
- **Examples:** Product cards, User profiles, Complete cards

### Modal Component
- **Location:** `src/Modal.stories.tsx`
- **Sizes:** Small, Medium, Large, Extra Large
- **Features:** Portal rendering, Overlay click, Escape key
- **Composable Parts:** Header, Body, Footer
- **Examples:** Confirmation dialogs, Forms, Long content

### Badge Component
- **Location:** `src/Badge.stories.tsx`
- **Variants:** Default, Primary, Secondary, Success, Danger, Warning, Info, Error
- **Sizes:** Small, Medium, Large
- **Features:** Dot indicator, Removable badges
- **Examples:** Status badges, Tags, Notifications, User roles

### Spinner Component
- **Location:** `src/Spinner.stories.tsx`
- **Sizes:** Small, Medium, Large
- **Colors:** Primary, White
- **Examples:** In buttons, Centered in cards, Full page loaders

### Skeleton Component
- **Location:** `src/Skeleton.stories.tsx`
- **Variants:** Text, Circular, Rectangular, Card
- **Features:** Multiple lines, Custom dimensions
- **Examples:** User profiles, Cards, Lists, Articles, Tables, Dashboards, Forms

## Story Structure

Each story file follows this structure:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Control definitions
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

## Addons

This Storybook setup includes the following addons:

- **@storybook/addon-links** - Link stories together
- **@storybook/addon-essentials** - Essential addons (Controls, Actions, Viewport, etc.)
- **@storybook/addon-interactions** - Test user interactions
- **@storybook/addon-a11y** - Accessibility testing

## Accessibility Testing

The a11y addon automatically checks stories for accessibility issues. View the "Accessibility" panel in Storybook to see:

- WCAG violations
- Color contrast issues
- Missing ARIA labels
- Keyboard navigation problems

## Controls

Use the Controls panel to:

- Modify component props in real-time
- Test different prop combinations
- Explore component behavior
- Generate code snippets

## Best Practices

1. **One Story Per Variant** - Create separate stories for each meaningful variant
2. **Descriptive Names** - Use clear, descriptive names for stories
3. **Interactive Examples** - Include interactive examples that demonstrate real usage
4. **Documentation** - Add JSDoc comments to components for auto-generated docs
5. **Accessibility** - Ensure all stories pass a11y checks

## Adding New Stories

To add a new story:

1. Create a new `.stories.tsx` file next to your component
2. Import the component and Storybook types
3. Define the meta configuration
4. Export story variants
5. Run Storybook to verify

Example:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props
  },
};
```

## Deployment

To deploy Storybook:

1. Build the static files: `npm run build-storybook`
2. Deploy the `storybook-static` directory to your hosting service
3. Common options: Netlify, Vercel, GitHub Pages, AWS S3

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Component Story Format](https://storybook.js.org/docs/react/api/csf)
- [Storybook Addons](https://storybook.js.org/addons)
- [Accessibility Testing](https://storybook.js.org/addons/@storybook/addon-a11y)
