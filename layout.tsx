import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Yamuna Plumbing & Civils Umhlanga | 24/7 Plumber",
  description:
    "24/7 emergency plumber in Umhlanga. Leak detection, high-pressure pipe repair, geyser installation, bathrooms, and commercial civil lines (vacuum, compressed air, LP gas, nitrogen, water). Rated 5.0 from 92+ Google reviews.",
  keywords: [
    "plumber Umhlanga",
    "24 hour plumber Durban",
    "emergency plumber Umhlanga",
    "geyser installation Umhlanga",
    "leak detection Durban North",
    "LP gas installation Umhlanga",
  ],
  openGraph: {
    title: "Yamuna Plumbing & Civils Umhlanga | 24/7 Plumber",
    description: "Emergency plumbing and civil lines in Umhlanga, day or night. 5.0 stars from 92+ Google reviews.",
    locale: "en_ZA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1826",
  width: "device-width",
  initialScale: 1,
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Plumber",
  name: "Yamuna Plumbing and Civils Umhlanga",
  telephone: "+27640484622",
  address: {
    "@type": "PostalAddress",
    streetAddress: "60 Meridian Dr",
    addressLocality: "Umhlanga",
    addressRegion: "KwaZulu-Natal",
    postalCode: "4319",
    addressCountry: "ZA",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "92" },
  areaServed: ["Umhlanga", "La Lucia", "Durban North", "Mount Edgecombe", "Umdloti"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
