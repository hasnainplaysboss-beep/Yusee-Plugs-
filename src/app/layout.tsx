import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yusee Plugs | Premium Tech & Accessories",
  description:
    "Shop Yusee Plugs for quality tech and accessories. Discover our collection, shop online and enjoy delivery included in the product price.",
  metadataBase: new URL("https://yusee-plugs.co.uk"),
  openGraph: {
    title: "Yusee Plugs | Premium Tech & Accessories",
    description:
      "Discover Yusee Plugs. Shop our collection of tech and accessories online.",
    url: "https://yusee-plugs.co.uk",
    siteName: "Yusee Plugs",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
