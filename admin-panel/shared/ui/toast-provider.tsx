"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        className:
          "!bg-zinc-900/95 !text-zinc-100 !text-sm !shadow-xl !shadow-black/40 !border !border-zinc-600/80 !backdrop-blur-md",
        style: {
          maxWidth: "24rem",
        },
        success: {
          iconTheme: {
            primary: "#a5b4fc",
            secondary: "#18181b",
          },
        },
        error: {
          iconTheme: {
            primary: "#fca5a5",
            secondary: "#18181b",
          },
        },
      }}
    />
  );
}
