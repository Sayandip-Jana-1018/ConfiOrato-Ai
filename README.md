# ConfiOrato-AI - Public Speaking Assistant

<p align="center">
  <img src="public/3dlogo.webp" alt="ConfiOrato Logo" width="200"/>
</p>

## 🎯 Overview

ConfiOrato-AI is a comprehensive public speaking assistant that leverages AI, computer vision, and speech recognition to provide real-time analysis and personalized feedback on your presentation skills. Whether you're preparing for a classroom presentation, job interview, conference talk, or executive briefing, ConfiOrato-AI helps you master the art of public speaking through data-driven insights and guided practice.

## ✨ Key Features

### 🧍 Body Language Analysis
- **Real-time Posture Detection**: Advanced skeletal tracking monitors shoulder alignment, spine posture, and body positioning
- **Gesture Recognition**: AI-powered system identifies and categorizes appropriate vs. distracting gestures
- **Skeletal Visualization**: Interactive overlay with customizable options (color schemes, line styles, joint labels)
- **Hand Movement Tracking**: Precise finger joint visualization for comprehensive hand gesture analysis
- **Facial Expression Analysis**: Detects engagement, confidence, and emotional signals

### 🎤 Voice Analysis
- **Volume Monitoring**: Real-time tracking with dynamic visualization of speaking volume
- **Speech Clarity Analysis**: Advanced algorithms measure articulation and word clarity
- **Speaking Pace Detection**: Monitors words-per-minute with optimal range indicators
- **Pitch Variation Tracking**: Analyzes vocal variety and engagement patterns
- **Filler Word Detection**: Identifies and tracks usage of um, uh, like, and other filler words

### 🤖 AI-Powered Coaching
- **Virtual Coach Avatar**: Customizable 3D humanoid model providing visual guidance and demonstrations
- **Context-Aware Feedback**: Tailored suggestions based on selected practice environment
- **Personalized Improvement Plans**: AI generates specific exercises based on your performance metrics
- **Progress Tracking**: Visual dashboards showing improvement over time across all metrics
- **Achievement System**: Gamified learning with badges and rewards for reaching milestones

### 🎮 Interactive Practice Environments
- **Classroom Setting**: Lower-pressure environment for educational presentations
- **Job Interview Simulation**: Practice answering questions with appropriate formality
- **Conference Simulation**: High-stakes environment for professional presentations
- **Executive Presentation**: Ultra-formal setting for leadership presentations
- **Customizable Scenarios**: Create your own practice environments with specific parameters

### 📊 Analytics & Insights
- **Comprehensive Metrics Dashboard**: Visual representation of all performance indicators
- **Session Recordings**: Review past practice with synchronized metrics and feedback
- **Trend Analysis**: Track improvement over time with detailed progress charts
- **Comparative Analysis**: Benchmark your performance against previous sessions
- **Exportable Reports**: Share or save your progress in multiple formats

### ♿ Accessibility Features
- **Keyboard Navigation**: Complete keyboard control with intuitive shortcuts
- **Screen Reader Support**: ARIA attributes and live regions for assistive technologies
- **Visual Accessibility**: High contrast mode, text size adjustments, and color vision deficiency modes
- **Sign Language Support**: Interpretation toggle and specialized video lessons
- **Multilingual Interface**: Support for multiple languages with localized feedback

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+ (for backend ML services)
- Webcam and microphone access

### Installation

#### Frontend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/Sayandip-Jana-1018/ConfiOrato-Ai.git
   ```
2. Navigate to the project directory
   ```bash
   cd ConfiOrato-Ai
   ```
3. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```
4. Create a `.env` file based on the provided `.env.example`
   ```
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GEMINI_API_KEY=your_gemini_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### Backend Setup
1. Navigate to the backend directory
   ```bash
   cd src/backend
   ```
2. Install Python dependencies
   ```bash
   pip install -r requirements.txt
   ```
3. Start the backend server
   ```bash
   python run_server.py
   ```

#### Launch the Application
1. In a new terminal, start the frontend development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```
2. Open your browser and navigate to `http://localhost:3000`

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.x, React 19.x
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: TailwindCSS, Framer Motion, Chakra UI
- **3D Rendering**: Three.js, React Three Fiber
- **Charts & Visualization**: Chart.js, React-ChartJS-2

### Backend & AI
- **Body Tracking**: MediaPipe (Pose, Hands, Holistic)
- **Audio Processing**: Web Audio API, TensorFlow.js
- **Machine Learning**: TensorFlow, PyTorch
- **AI Integration**: OpenAI API, Google Gemini API, Anthropic Claude API
- **Database**: Supabase (PostgreSQL)

### DevOps
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend), Python anywhere (backend)

## 📱 Usage Scenarios

### For Students
- Practice classroom presentations with feedback focused on clarity and engagement
- Prepare for academic speaking engagements with structured guidance
- Build confidence through regular practice in low-pressure environments

### For Job Seekers
- Simulate interview scenarios with industry-specific questions
- Receive feedback on professional communication style
- Improve non-verbal cues critical for making good impressions

### For Professionals
- Prepare for conference talks with formal presentation standards
- Practice executive briefings with focus on conciseness and impact
- Develop consistent speaking patterns for regular team meetings

## 🤝 Contributing

We welcome contributions to ConfiOrato-AI! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- MediaPipe team for their incredible computer vision tools
- TensorFlow.js team for browser-based ML capabilities
- The open-source community for various libraries and tools
- All contributors who have helped shape this project

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Sayandip-Jana-1018">Sayandip Jana</a>
</p>
