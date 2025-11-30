import ReactDOM from "react-dom/client";
import React from "react";
import App from "#App";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // React.StrictMode - helps with finding problems in app in dev mode (e.g. deprecated components)
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error("Element with id 'root' not found");
}
