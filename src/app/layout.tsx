import type { Metadata, Viewport } from "next";
import "@/style/globals.css";
import { Typography } from "@mui/material";

export const metadata: Metadata = {
  title: "Peek-a-Boo",
  description: "Student Monitor | By Bis90",
  manifest: "/manifest.webmanifest",
  applicationName: 'Peek-a-Boo',
  authors: [
    { name: 'Michael K. Steinberg (Bis 90 כ"ה)' },
  ],
  creator: 'Michael K. Steinberg',
  keywords: [ 'peekaboo', 'peek-a-boo', 'student monitor', 'bis90', 'vnc', 'shadow', 'rdp', 'x-control', 'x-shadow', 'x-rdp', 'bisvnc', 'bis-vnc', 'tightvnc', ],
};

export const viewport: Viewport = {
  themeColor: '#bb86fc',
};

function Footer()
{
  return (<></>);
  return (
    <footer className="w-full flex flex-col items-center p-4 opacity-35 absolute bottom-0">
      <Typography variant="h6" fontWeight={ 500 }>
        By Itay Ben Haim & Michael K. Steinberg (Bis 90 כ&quot;ה)
      </Typography>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
{
  return (
    <html lang="en">
      <body className={ `antialiased bg-[#0a0a0a] w-full overflow-x-hidden` }>
        { children }
        <Footer />
      </body>
    </html>
  );
}
