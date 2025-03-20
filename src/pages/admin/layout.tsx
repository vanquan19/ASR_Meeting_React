import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../../components/admin/theme-provider";
import Sidebar from "../../components/admin/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Meeting Room Management",
  description: "Admin dashboard for managing meeting rooms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
