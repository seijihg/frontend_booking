"use client";

import { useEffect } from "react";

export default function Redirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, []);
  return null;
}
