# Pomodoro Timer

A beautiful, modern Pomodoro timer built with React and TypeScript. Stay focused and productive with this simple yet powerful timer application.

🌐 **Live Demo**: [https://project-rho-one-58.vercel.app](https://project-rho-one-58.vercel.app)

## Features

- ⏰ **25/5/15 Pomodoro Technique**: 25-minute work sessions, 5-minute short breaks, 15-minute long breaks
- 🎯 **Session Tracking**: Visual progress bar and session counter
- 📝 **Todo Management**: Add, organize, and track todos with Eisenhower Matrix categories
- ⚙️ **Customizable Settings**: Adjust work time, break durations, and sessions before long break
- 🔔 **Notifications**: Audio alerts and browser notifications when sessions complete
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ☁️ **Cloud Sync**: Sign in to sync your data across devices (powered by Supabase)
- 📊 **Work Log**: Track your productivity and view session history
- 🎨 **Modern UI**: Clean, gradient design with smooth animations using Ant Design
- ⚛️ **React + TypeScript**: Built with modern React hooks and TypeScript for type safety

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Ant Design** - UI component library
- **Styled Components** - CSS-in-JS styling
- **Supabase** - Backend-as-a-Service for authentication and database
- **Vercel** - Deployment and hosting platform

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## How to Use

1. **Visit the App**: Go to [https://project-rho-one-58.vercel.app](https://project-rho-one-58.vercel.app)
2. **Sign In (Optional)**: Create an account to sync your todos and settings across devices
3. **Set Your Todos**: Use the Todo tab to add tasks organized by the Eisenhower Matrix
4. **Choose Mode**: Select between Work, Short Break, or Long Break on the Timer tab
5. **Start Focus Session**: Click "Start" and select a todo to focus on during work sessions
6. **Track Progress**: View your productivity in the Work Log tab
7. **Customize Settings**: Adjust timer durations and preferences in the Settings tab

## Pomodoro Technique

The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.

### Basic Workflow:
1. **Work Session**: 25 minutes of focused work
2. **Short Break**: 5 minutes to rest and recharge
3. **Repeat**: Complete 4 work sessions
4. **Long Break**: 15 minutes for a longer rest period

## Project Structure

```
src/
├── components/          # React components
│   ├── TimerDisplay.tsx
│   ├── TimerControls.tsx
│   ├── ModeSelector.tsx
│   ├── SessionTracker.tsx
│   └── Settings.tsx
├── hooks/              # Custom React hooks
│   └── useTimer.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main App component
├── App.css             # Component styles
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Features in Detail

### Timer Controls
- **Start**: Begin the current session
- **Pause**: Temporarily stop the timer
- **Reset**: Reset the timer to the full duration

### Session Tracking
- Visual progress bar shows completion percentage
- Session counter tracks completed work sessions
- Automatic mode switching between work and breaks

### Notifications
- Audio notification when sessions complete
- Browser notifications (if permitted)
- Visual animation on timer completion

### Responsive Design
- Mobile-friendly interface
- Touch-optimized buttons
- Adaptive layout for different screen sizes

### TypeScript Benefits
- Type-safe component props
- IntelliSense and autocomplete
- Catch errors at compile time
- Better developer experience

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure

The application uses:
- **Functional Components** with React hooks
- **Custom Hook** (`useTimer`) for timer logic
- **TypeScript interfaces** for type safety
- **CSS modules** for component styling
- **Local Storage** for persistent settings

## Tips for Effective Use

1. **Find Your Rhythm**: Start with the default 25/5/15 settings, then adjust based on your productivity patterns
2. **Eliminate Distractions**: During work sessions, close unnecessary tabs and apps
3. **Take Real Breaks**: Use break time to step away from your screen
4. **Track Progress**: Monitor your completed sessions to build momentum
5. **Be Consistent**: Try to use the timer regularly to build the habit

## Browser Compatibility

This timer works in all modern browsers that support:
- React 18
- TypeScript
- ES6+ features
- Web Audio API
- Notifications API

## License

This project is open source and available under the MIT License.

---

**Happy focusing! 🍅** 