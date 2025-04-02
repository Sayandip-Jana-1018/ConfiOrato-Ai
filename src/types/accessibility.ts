/**
 * Common accessibility-related types used throughout the application
 */

/** Roles for ARIA attributes */
export type AriaRole = 
  | 'alert'
  | 'alertdialog'
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'gridcell'
  | 'link'
  | 'listbox'
  | 'menu'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'scrollbar'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

/** Live region politeness settings */
export type AriaLive = 'off' | 'polite' | 'assertive';

/** Common ARIA states */
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-details'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: AriaLive;
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-pressed'?: boolean | 'mixed';
  'aria-readonly'?: boolean;
  'aria-required'?: boolean;
  'aria-selected'?: boolean;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
}

/** High contrast mode settings */
export type HighContrastMode = 'normal' | 'high' | 'white' | 'black';

/** Text size settings */
export type TextSize = 'normal' | 'large' | 'xlarge';

/** Color vision modes for color blindness support */
export type ColorVisionMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** Speech rate settings for screen readers */
export type SpeechRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

/** Accessibility settings interface */
export interface AccessibilitySettings {
  highContrastMode: HighContrastMode;
  textSize: TextSize;
  colorVisionMode: ColorVisionMode;
  speechRate: SpeechRate;
  signLanguageEnabled: boolean;
  announcePageChanges: boolean;
  announceNotifications: boolean;
  keyboardNavigationEnabled: boolean;
  focusIndicatorsEnabled: boolean;
  reducedMotion: boolean;
}
