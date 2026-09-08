import type { Metadata } from "next";
import { GradientBackground } from "@/components/ui/bloom-field-gradient";
import { SITE } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s - ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div aria-hidden className="fixed inset-0 -z-10">
          <GradientBackground className="h-full w-full" />
        </div>
        {children}
      </body>
    </html>
  );
}
