import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yusee Plugs | Streetwear & Everyday Icons",
  description: "Shop the latest streetwear, footwear and everyday essentials at Yusee Plugs."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
