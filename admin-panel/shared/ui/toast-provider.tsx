"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        className:
          "!bg-[#12101a]/95 !text-zinc-100 !text-sm !shadow-2xl !shadow-black/50 !border !border-white/12 !backdrop-blur-md",
        style: {
          maxWidth: "24rem",
        },
        success: {
          iconTheme: {
            primary: "#c8ff3d",
            secondary: "#0a090e",
          },
        },
        error: {
          iconTheme: {
            primary: "#fb7185",
            secondary: "#0a090e",
          },
        },
      }}
    />
  );
}
