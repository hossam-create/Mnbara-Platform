# Modal Component

A fully accessible Modal component with React portal support for the @mnbara/ui-components package.

## Features

- ✅ **React Portal**: Renders outside the DOM hierarchy to avoid z-index issues
- ✅ **Accessibility**: Full ARIA attributes, focus management, and keyboard navigation
- ✅ **Escape Key**: Close modal with Escape key (configurable)
- ✅ **Click Outside**: Close modal by clicking overlay (configurable)
- ✅ **Body Scroll Lock**: Prevents background scrolling when modal is open
- ✅ **Focus Management**: Automatically focuses modal and restores focus on close
- ✅ **Customizable Sizes**: sm, md, lg, xl size variants
- ✅ **Composable**: Header, Body, and Footer sub-components

## Installation

```bash
npm install @mnbara/ui-components
```

## Basic Usage

```tsx
import { Modal } from '@mnbara/ui-components';
import { useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header onClose={() => setIsOpen(false)}>
          Modal Title
        </Modal.Header>
        <Modal.Body>
          <p>This is the modal content.</p>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

## Props

### Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls modal visibility |
| `onClose` | `() => void` | required | Callback when modal should close |
| `children` | `React.ReactNode` | required | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |
| `closeOnOverlayClick` | `boolean` | `true` | Close modal when clicking overlay |
| `closeOnEscape` | `boolean` | `true` | Close modal when pressing Escape |
| `portalTarget` | `HTMLElement` | `document.body` | Custom portal target element |

### Modal.Header Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Header content |
| `onClose` | `() => void` | optional | Shows close button if provided |

### Modal.Body Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Body content |
| `className` | `string` | `''` | Additional CSS classes |

### Modal.Footer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Footer content |
| `className` | `string` | `''` | Additional CSS classes |

## Examples

### Different Sizes

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="sm">
  <Modal.Body>Small modal</Modal.Body>
</Modal>

<Modal isOpen={isOpen} onClose={onClose} size="lg">
  <Modal.Body>Large modal</Modal.Body>
</Modal>

<Modal isOpen={isOpen} onClose={onClose} size="xl">
  <Modal.Body>Extra large modal</Modal.Body>
</Modal>
```

### Without Close on Overlay Click

```tsx
<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  closeOnOverlayClick={false}
>
  <Modal.Body>
    Click outside won't close this modal
  </Modal.Body>
</Modal>
```

### Without Escape Key

```tsx
<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  closeOnEscape={false}
>
  <Modal.Body>
    Escape key won't close this modal
  </Modal.Body>
</Modal>
```

### Custom Portal Target

```tsx
const modalRoot = document.getElementById('modal-root');

<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  portalTarget={modalRoot}
>
  <Modal.Body>
    This modal renders in a custom container
  </Modal.Body>
</Modal>
```

### Confirmation Dialog

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="sm">
  <Modal.Header onClose={onClose}>
    Confirm Action
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to delete this item?
  </Modal.Body>
  <Modal.Footer>
    <button onClick={onClose}>Cancel</button>
    <button onClick={handleConfirm}>Delete</button>
  </Modal.Footer>
</Modal>
```

### Form Modal

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header onClose={onClose}>
    Create New Item
  </Modal.Header>
  <Modal.Body>
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Name" />
      <textarea placeholder="Description" />
    </form>
  </Modal.Body>
  <Modal.Footer>
    <button onClick={onClose}>Cancel</button>
    <button onClick={handleSubmit}>Create</button>
  </Modal.Footer>
</Modal>
```

## Accessibility

The Modal component follows WAI-ARIA best practices:

- Uses `role="dialog"` and `aria-modal="true"`
- Automatically focuses the modal when opened
- Restores focus to the previously focused element when closed
- Supports keyboard navigation (Escape key to close)
- Overlay is marked with `aria-hidden="true"`
- Prevents body scroll when open

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
