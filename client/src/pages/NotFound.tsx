import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  // On GitHub Pages, any unmatched route is a result of the SPA redirect.
  // Since GRASP has only one page, auto-redirect to home immediately.
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  // Render nothing while redirecting
  return null;
}

