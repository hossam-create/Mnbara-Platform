import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from './Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    hover: {
      control: 'boolean',
    },
    padding: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Card.Body>
        <p>This is a default card with some content.</p>
      </Card.Body>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <Card.Body>
        <p>This is an outlined card.</p>
      </Card.Body>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <Card.Body>
        <p>This is an elevated card with shadow.</p>
      </Card.Body>
    ),
  },
};

export const WithHeader: Story = {
  args: {
    children: (
      <>
        <Card.Header title="Card Title" subtitle="Card subtitle goes here" />
        <Card.Body>
          <p>This card has a header with title and subtitle.</p>
        </Card.Body>
      </>
    ),
  },
};

export const WithHeaderAction: Story = {
  args: {
    children: (
      <>
        <Card.Header 
          title="Card with Action" 
          subtitle="This card has an action button"
          action={<Button size="sm" variant="ghost">Edit</Button>}
        />
        <Card.Body>
          <p>The header includes an action button on the right.</p>
        </Card.Body>
      </>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    children: (
      <>
        <Card.Header title="Card with Footer" />
        <Card.Body>
          <p>This card has a footer section.</p>
        </Card.Body>
        <Card.Footer>
          <p className="text-sm text-gray-500">Footer content</p>
        </Card.Footer>
      </>
    ),
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <>
        <Card.Header title="User Profile" subtitle="Manage your account settings" />
        <Card.Body>
          <p>Update your profile information and preferences.</p>
        </Card.Body>
        <Card.Footer>
          <Card.Actions align="right">
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </Card.Actions>
        </Card.Footer>
      </>
    ),
  },
};

export const CompleteCard: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <Card.Header 
          title="Complete Card Example" 
          subtitle="This card demonstrates all features"
          action={<Button size="sm" variant="ghost">⋮</Button>}
        />
        <Card.Body>
          <p className="mb-4">This is a complete card with header, body, footer, and actions.</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Header with title, subtitle, and action</li>
            <li>Body with content</li>
            <li>Footer with action buttons</li>
          </ul>
        </Card.Body>
        <Card.Footer>
          <Card.Actions align="right" spacing="md">
            <Button variant="ghost">Cancel</Button>
            <Button variant="secondary">Save Draft</Button>
            <Button variant="primary">Publish</Button>
          </Card.Actions>
        </Card.Footer>
      </>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    hover: true,
    children: (
      <Card.Body>
        <p>Hover over this card to see the effect.</p>
      </Card.Body>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    padding: true,
    children: <p>This card has padding applied directly to the card container.</p>,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: (
      <>
        <Card.Header title="Full Width Card" />
        <Card.Body>
          <p>This card takes the full width of its container.</p>
        </Card.Body>
      </>
    ),
  },
  parameters: {
    layout: 'padded',
  },
};

export const ProductCard: Story = {
  args: {
    variant: 'elevated',
    hover: true,
    children: (
      <>
        <div className="aspect-video bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">Product Image</span>
        </div>
        <Card.Body>
          <h3 className="text-lg font-semibold mb-2">Product Name</h3>
          <p className="text-gray-600 text-sm mb-4">Product description goes here with details about the item.</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">$99.99</span>
            <Button size="sm" variant="primary">Add to Cart</Button>
          </div>
        </Card.Body>
      </>
    ),
  },
};
