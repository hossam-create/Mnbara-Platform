import React from 'react';
import { Helmet } from 'react-helmet-async';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title = 'Mnbara Marketplace', description }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      {children}
    </div>
  );
}
