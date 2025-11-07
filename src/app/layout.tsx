import type { Metadata } from "next";
import "@/style/globals.css";
import { Typography } from "@mui/material";

export const metadata: Metadata = {
  title: "Peek-a-Boo",
  description: "Student Monitor | By Bis90",
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
      <body className={ `antialiased bg-[#121212] w-full overflow-x-hidden` }>
        { children }
        <Footer />
      </body>
    </html>
  );
}
