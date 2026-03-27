import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'error'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
    removable: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger',
    variant: 'danger',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const WithDot: Story = {
  args: {
    children: 'Active',
    variant: 'success',
    dot: true,
  },
};

export const Removable: Story = {
  args: {
    children: 'Removable',
    variant: 'primary',
    removable: true,
    onRemove: () => alert('Badge removed!'),
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot>Active</Badge>
      <Badge variant="warning" dot>Pending</Badge>
      <Badge variant="danger" dot>Inactive</Badge>
      <Badge variant="info" dot>Draft</Badge>
    </div>
  ),
};

export const TagBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" removable onRemove={() => {}}>React</Badge>
      <Badge variant="primary" removable onRemove={() => {}}>TypeScript</Badge>
      <Badge variant="primary" removable onRemove={() => {}}>Tailwind</Badge>
      <Badge variant="primary" removable onRemove={() => {}}>Storybook</Badge>
    </div>
  ),
};

export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm" variant="primary">Small</Badge>
      <Badge size="md" variant="primary">Medium</Badge>
      <Badge size="lg" variant="primary">Large</Badge>
    </div>
  ),
};

export const VariantShowcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  ),
};

export const NotificationBadge: Story = {
  render: () => (
    <div className="relative inline-block">
      <button className="px-4 py-2 bg-gray-200 rounded-lg">
        Notifications
      </button>
      <Badge 
        variant="danger" 
        size="sm" 
        className="absolute -top-2 -right-2"
      >
        5
      </Badge>
    </div>
  ),
};

export const UserRoleBadges: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">John Doe</span>
        <Badge variant="primary" size="sm">Admin</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Jane Smith</span>
        <Badge variant="success" size="sm">Moderator</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Bob Johnson</span>
        <Badge variant="secondary" size="sm">User</Badge>
      </div>
    </div>
  ),
};
