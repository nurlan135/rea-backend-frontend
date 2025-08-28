import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giriş | REA INVEST',
  description: 'REA INVEST əmlak idarəetmə sisteminə giriş',
  keywords: ['REA INVEST', 'giriş', 'login', 'əmlak idarəetmə', 'Azərbaycan'],
  robots: 'noindex, nofollow', // Prevent indexing of login page
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
  openGraph: {
    title: 'REA INVEST - Əmlak İdarəetmə Sistemi',
    description: 'REA INVEST əmlak idarəetmə sisteminə daxil olun',
    type: 'website',
    locale: 'az_AZ',
  },
  other: {
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Preconnect to important domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* Security headers via meta tags */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Additional meta tags for login page */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Structured data for organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'REA INVEST',
            description: 'Əmlak İdarəetmə Sistemi',
            url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'technical support',
              description: 'Texniki dəstək',
            },
          }),
        }}
      />
      
      {children}
    </>
  );
}