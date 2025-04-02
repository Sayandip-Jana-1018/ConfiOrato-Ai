# ConfiOrato-AI - Public Speaking Assistant

ConfiOrato is an advanced public speaking assistant that provides real-time analysis and feedback on your body language, voice, and speech patterns to help you become a more effective presenter.

## Features

### Body Language Analysis
- **Real-time Posture Detection**: Tracks shoulder alignment, spine posture, and overall body positioning
- **Gesture Recognition**: Identifies appropriate and inappropriate gestures during presentations
- **Skeletal Visualization**: Dynamic overlay with customizable options (color schemes, line styles, joint labels)
- **Hand Movement Tracking**: Detailed finger joint visualization for comprehensive hand gesture analysis

### Voice Analysis
- **Volume Monitoring**: Real-time tracking of speaking volume
- **Speech Clarity Analysis**: Measures how clearly you articulate words
- **Speaking Pace Detection**: Monitors your speaking rate
- **Pitch Variation Tracking**: Analyzes vocal variety and engagement

### Interactive Features
- **Virtual Coach Avatar**: 3D humanoid model providing visual guidance
- **Tabbed Interface**: Organized sections for Allowed Gestures, Disallowed Gestures, AI Insights, and Metrics
- **Session Recording**: Practice sessions with timer and post-recording analysis
- **AI-Generated Feedback**: Personalized suggestions with fallback system for offline use

### Accessibility
- **Keyboard Navigation**: Full keyboard control with arrow keys and tab navigation
- **Screen Reader Support**: ARIA attributes and live regions for assistive technologies
- **Visual Accessibility**: High contrast mode, text size adjustments, and color vision modes
- **Sign Language Support**: Interpretation toggle and video lessons

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
   ```
   git clone https://github.com/Sayandip-Jana-1018/ConfiOrato-Ai.git
   ```
2. Navigate to the project directory
   ```
   cd ConfiOrato-Ai
   ```
3. Install dependencies
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```
4. Start the development server
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Technologies Used
- **Frontend**: Next.js, React, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **3D Rendering**: Three.js, React Three Fiber
- **Body Tracking**: MediaPipe Pose
- **Audio Processing**: Web Audio API
- **Charts**: Chart.js
- **AI Integration**: Gemini API (with client-side fallback)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
