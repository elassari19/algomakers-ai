import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/AppHeader';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar isAdmin />
      <SidebarInset className="h-screen">
        <AppHeader />
        <SidebarTrigger
          size="lg"
          className="absolute inset-y-2 top-1 z-90 flex items-center cursor-pointer transition p-1 rounded-md"
        />
        <div className="flex-1 p-2 py-8 sm:p-2 min-h-screen overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}