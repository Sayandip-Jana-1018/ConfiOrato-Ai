import { useState } from 'react';

export function useTheme() {
  const [themeColor] = useState('#6D28D9'); // Default to purple

  return {
    themeColor
  };
}
