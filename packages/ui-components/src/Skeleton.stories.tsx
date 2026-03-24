import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'card'],
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    lines: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 40,
    height: 40,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
  },
};

export const Card: Story = {
  args: {
    variant: 'card',
    width: 300,
    height: 200,
  },
};

export const MultipleLines: Story = {
  args: {
    variant: 'text',
    lines: 3,
  },
};

export const CustomWidth: Story = {
  args: {
    variant: 'text',
    width: '300px',
  },
};

export const CustomHeight: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 150,
  },
};

export const UserProfileSkeleton: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <div className="flex-1">
        <Skeleton variant="text" width="200px" height="20px" />
        <Skeleton variant="text" width="150px" height="16px" className="mt-2" />
      </div>
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-80 bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div className="p-4">
        <Skeleton variant="text" width="80%" height="24px" />
        <Skeleton variant="text" lines={2} className="mt-2" />
        <div className="flex items-center justify-between mt-4">
          <Skeleton variant="text" width="60px" height="20px" />
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      </div>
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" height="18px" />
            <Skeleton variant="text" width="50%" height="14px" className="mt-1" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const ArticleSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Skeleton variant="rectangular" width="100%" height={300} className="mb-4" />
      <Skeleton variant="text" width="90%" height="32px" className="mb-2" />
      <Skeleton variant="text" width="60%" height="20px" className="mb-4" />
      <Skeleton variant="text" lines={5} />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const TableSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton variant="text" width="200px" height="24px" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 grid grid-cols-3 gap-4">
              <Skeleton variant="text" height="16px" />
              <Skeleton variant="text" height="16px" />
              <Skeleton variant="text" height="16px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-6xl grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <Skeleton variant="text" width="120px" height="20px" className="mb-2" />
          <Skeleton variant="text" width="80px" height="32px" />
        </div>
      ))}
      <div className="col-span-3 bg-white rounded-lg shadow p-6">
        <Skeleton variant="text" width="200px" height="24px" className="mb-4" />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const FormSkeleton: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div>
        <Skeleton variant="text" width="100px" height="16px" className="mb-2" />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
      <div>
        <Skeleton variant="text" width="120px" height="16px" className="mb-2" />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
      <div>
        <Skeleton variant="text" width="80px" height="16px" className="mb-2" />
        <Skeleton variant="rectangular" width="100%" height={100} />
      </div>
      <div className="flex gap-2 justify-end">
        <Skeleton variant="rectangular" width={80} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  ),
};
