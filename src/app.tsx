import { createRoot } from "react-dom/client";
import { Home } from "./screens";

const App = () => {
    return (
        <Home />
    );
};

const root = createRoot(document.body);
root.render(<App />);
