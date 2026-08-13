# One Stop 🍿

![One Stop Hero](https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop)

**One Stop** is a premium, Netflix-style streaming platform designed for a flawless cinematic experience. It combines a dynamic glassmorphic UI, real-time metadata from TMDB, and seamless video streaming playback.

🎥 **Live Demo:** [https://one-stop-zvu1.vercel.app/](https://one-stop-zvu1.vercel.app/)

## ✨ Key Features

*   **Cinematic Player Experience:** A clean, immersive video player with three visual states (Playing, Mouse Active, Paused + Idle).
*   **Intelligent Pause Detection:** Integrates seamlessly with the Vidking player using the `postMessage` API to accurately detect play/pause states, showing the title overlay only when you pause.
*   **Cineby-Style Episode Sidebar:** A beautifully animated, slide-in sidebar for TV shows that lets you seamlessly switch seasons and episodes. Complete with episode thumbnails, descriptions, runtimes, and a "WATCHING" indicator.
*   **Dynamic Data Layer:** Powered by the TMDB API to fetch up-to-date movie and TV show metadata, including seasons, episodes, cast, and high-quality backdrops.
*   **Premium UI/UX:** Built with a design system featuring glassmorphism (`backdrop-filter`), smooth spring animations via Framer Motion, and a carefully crafted typography scale.
*   **Full Keyboard Navigation:** Intuitive keyboard controls (Spacebar to pause, Escape to close overlays/navigate back).

## 🛠️ Technology Stack

**Frontend:**
*   [Next.js](https://nextjs.org/) (App Router) - React Framework
*   [Framer Motion](https://www.framer.com/motion/) - Fluid animations and gestures
*   Custom CSS & CSS Variables - Maintainable, scalable styling
*   React Query - Data fetching and caching

**Backend:**
*   [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) - API Server
*   [TMDB API](https://developer.themoviedb.org/docs) - Movie and TV Show metadata source

**Streaming Integration:**
*   [Vidking](https://vidking.net/) - High-performance embeddable streaming player

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   A TMDB API Key

### Installation

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    cd frontend && npm install
    ```
3.  **Configure Environment Variables:**
    *   In the `frontend` directory, create a `.env.local` based on `.env.example` and fill in `MONGODB_URI`, `JWT_SECRET`, and `TMDB_API_KEY`.

### Running Locally

The API lives in `frontend/src/app/api` as Next.js route handlers, so there is only one service to run.

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The legacy Express server in `backend/` is kept for reference only and is no longer used or deployed.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you'd like to improve the project.

## 📄 License

This project is licensed under the MIT License.
