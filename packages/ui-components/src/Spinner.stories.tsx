import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'white'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Primary: Story = {
  args: {
    color: 'primary',
  },
};

export const White: Story = {
  args: {
    color: 'white',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="mt-2 text-xs text-gray-500">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="mt-2 text-xs text-gray-500">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-2 text-xs text-gray-500">Large</p>
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
      <Spinner size="sm" color="white" className="mr-2" />
      Loading...
    </button>
  ),
};

export const CenteredInCard: Story = {
  render: () => (
    <div className="w-64 h-48 bg-white rounded-lg shadow-md flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-gray-600">Loading data...</p>
    </div>
  ),
};

export const FullPageLoader: Story = {
  render: () => (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Please wait...</p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <span className="text-gray-600">Processing your request...</span>
    </div>
  ),
};
