import { AppSidebar } from '@/components/app-sidebar';
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
      <SidebarInset>
        <SidebarTrigger
          size="lg"
          className="absolute inset-y-2 top-2 z-90 flex items-center cursor-pointer bg-red-500/30 backdrop-blur-sm hover:bg-gray-500/50 transition p-1 rounded-md"
        />
        <div className="p-2 py-8 sm:p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
