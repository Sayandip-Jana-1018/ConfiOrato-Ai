import { Inter, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import path from "path";

export const inter = Inter({ subsets: ["latin"] });

export const interVar = localFont({
  src: path.resolve(process.cwd(), "src/pages/InterVariable.ttf"),
  variable: "--font-inter-var",
});

export const ibmPlex = IBM_Plex_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
});
