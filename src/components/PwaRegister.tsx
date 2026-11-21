"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("ludus_theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}
