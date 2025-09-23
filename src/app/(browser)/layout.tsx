import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SearchInput } from '@/components/SearchInput';
import { UserAvatarMenu } from '@/components/auth/UserAvatarMenu';

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
          size="icon"
          className="absolute inset-y-2 -left-0 top-2 z-10 flex items-center cursor-pointer"
        />
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
