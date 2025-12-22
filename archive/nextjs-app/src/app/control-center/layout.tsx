import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ControlShell } from '@/components/control-center/ControlShell';

export const metadata: Metadata = {
  title: 'Ship Control Panel – Mnbarh',
};

export default function ControlCenterLayout({ children }: { children: ReactNode }) {
  return <ControlShell>{children}</ControlShell>;
}
