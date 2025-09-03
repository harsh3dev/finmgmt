import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { NavigationProvider } from "@/components/providers/navigation-provider";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Finance Management",
  description: "Finance Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ReduxProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NavigationProvider>
                {children}
              </NavigationProvider>
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}