import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/AppHeader';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function BrowserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-auto">
        <AppHeader />
        <SidebarTrigger
          size="lg"
          className="absolute inset-y-2 top-1 z-90 flex items-center cursor-pointer transition p-1 rounded-md"
        />
        <div className="flex-1 p-2 py-8 sm:p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
