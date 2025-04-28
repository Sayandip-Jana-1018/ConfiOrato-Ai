import type { AppProps } from 'next/app';
import { ThemeProvider } from '../context/ThemeContext';
import { VoiceAssistantProvider } from '../context/VoiceAssistantContext';
import { NavigationProvider } from '../context/NavigationContext';
import VoiceNavigationHandler from '../components/voice-assistant/VoiceNavigationHandler';
import '../styles/globals.css';
import '../styles/markdown.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <VoiceAssistantProvider>
          <VoiceNavigationHandler />
          <Component {...pageProps} />
        </VoiceAssistantProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
