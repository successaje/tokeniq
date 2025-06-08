import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DashboardLayout as DashboardLayoutComponent } from '@/components/layouts/DashboardLayout';

export const metadata: Metadata = {
  title: 'Dashboard | TokenIQ X',
  description: 'TokenIQ X Dashboard - Manage your DeFi assets',
};

// This component wraps all dashboard pages with the dashboard layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardLayoutComponent>
        {children}
      </DashboardLayoutComponent>
    </div>
  );
}
