import type { Metadata } from 'next';
import './globals.css';
<<<<<<< HEAD
import Providers from '@/components/providers';
import Header from '@/components/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Definition Detective',
  description: 'An endless word puzzle game with a twist.',
=======
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Definition Detective',
  description: 'An exciting word puzzle game with endless procedurally generated levels!',
>>>>>>> e3022b0a0d8c07c085311a31fdf53cd8935a5097
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <Providers>
            <div className="relative flex min-h-screen w-full flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </Providers>
        </FirebaseClientProvider>
=======
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400;1,7..72,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen">
        {children}
        <Toaster />
>>>>>>> e3022b0a0d8c07c085311a31fdf53cd8935a5097
      </body>
    </html>
  );
}
