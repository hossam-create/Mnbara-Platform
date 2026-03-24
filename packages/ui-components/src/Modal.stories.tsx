import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle modal state
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    children: (
      <>
        <Modal.Header onClose={() => {}}>Modal Title</Modal.Header>
        <Modal.Body>
          <p>This is the modal content. You can put any content here.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const Small: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'sm',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Small Modal</Modal.Header>
        <Modal.Body>
          <p>This is a small modal.</p>
        </Modal.Body>
      </>
    ),
  },
};

export const Medium: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'md',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Medium Modal</Modal.Header>
        <Modal.Body>
          <p>This is a medium modal (default size).</p>
        </Modal.Body>
      </>
    ),
  },
};

export const Large: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'lg',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Large Modal</Modal.Header>
        <Modal.Body>
          <p>This is a large modal with more space for content.</p>
        </Modal.Body>
      </>
    ),
  },
};

export const ExtraLarge: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'xl',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Extra Large Modal</Modal.Header>
        <Modal.Body>
          <p>This is an extra large modal for complex content.</p>
        </Modal.Body>
      </>
    ),
  },
};

export const WithoutCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    children: (
      <>
        <Modal.Header>Modal Without Close Button</Modal.Header>
        <Modal.Body>
          <p>This modal doesn't have a close button in the header.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary">OK</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const ConfirmationDialog: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'sm',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Confirm Action</Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const FormModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'md',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Create New Item</Modal.Header>
        <Modal.Body>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter description"
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Create</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const LongContent: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    size: 'lg',
    children: (
      <>
        <Modal.Header onClose={() => {}}>Terms and Conditions</Modal.Header>
        <Modal.Body className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost">Decline</Button>
          <Button variant="primary">Accept</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const NoOverlayClose: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    closeOnOverlayClick: false,
    children: (
      <>
        <Modal.Header onClose={() => {}}>Cannot Close by Clicking Outside</Modal.Header>
        <Modal.Body>
          <p>This modal cannot be closed by clicking the overlay. You must use the close button or action buttons.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary">Close</Button>
        </Modal.Footer>
      </>
    ),
  },
};

export const NoEscapeClose: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    closeOnEscape: false,
    children: (
      <>
        <Modal.Header onClose={() => {}}>Cannot Close with Escape Key</Modal.Header>
        <Modal.Body>
          <p>This modal cannot be closed by pressing the Escape key. You must use the close button or action buttons.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary">Close</Button>
        </Modal.Footer>
      </>
    ),
  },
};
