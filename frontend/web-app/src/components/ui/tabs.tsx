import React, { useState } from 'react';
import { clsx } from 'clsx';

export interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
}>({
  value: '',
  setValue: () => {}
});

const Tabs: React.FC<TabsProps> = ({ defaultValue = '', children, className }) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={clsx('flex space-x-1 border-b border-gray-200', className)}>
      {children}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, onClick }) => {
  const { value: currentValue, setValue } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      className={clsx(
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        isActive
          ? 'border-yellow-500 text-yellow-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        className
      )}
      onClick={() => {
        setValue(value);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className }) => {
  const { value: currentValue } = React.useContext(TabsContext);
  
  if (currentValue !== value) {
    return null;
  }

  return (
    <div className={clsx('py-4', className)}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
