import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { AiFloatingWidget } from "@/components/ai/AiFloatingWidget";

export const metadata: Metadata = {
  title: "EduSphere - School Management System",
  description: "Complete school ERP solution for managing students, teachers, attendance, fees, and more",
};

import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from "@/contexts/SocketContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import GoogleMapsProvider from "@/providers/GoogleMapsProvider";
import { GlobalErrorBoundary } from "@/components/providers/GlobalErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <GlobalErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                <NotificationProvider>
                  <GoogleMapsProvider>
                    {children}
                  </GoogleMapsProvider>
                </NotificationProvider>
              </SocketProvider>
              <AiFloatingWidget />
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
