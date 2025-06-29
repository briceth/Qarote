import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

initSentry();

createRoot(document.getElementById("root")!).render(<App />);
