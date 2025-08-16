import { createRoot } from "react-dom/client";

const App = () => {
    return (
        <div>
            <h1>My Tasks</h1>
            <p>Welcome to your Electron application.</p>
        </div>
    );
};

const root = createRoot(document.body);
root.render(<App />);
