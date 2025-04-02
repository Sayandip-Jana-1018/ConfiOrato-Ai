import Head from 'next/head';

export default function CustomFonts() {
  return (
    <Head>
      {/* Import custom fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Apply fonts to global styles */}
      <style jsx global>{`
        :root {
          --font-primary: 'Space Grotesk', sans-serif;
          --font-secondary: 'Poppins', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-primary);
        }
        
        body, p, input, button {
          font-family: var(--font-secondary);
        }
      `}</style>
    </Head>
  );
}
