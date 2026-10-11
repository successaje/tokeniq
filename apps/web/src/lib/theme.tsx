"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "tokeniq-theme";

/** Runs before paint (inlined in <head>) so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();`;

const Ctx = createContext<{ pref: ThemePref; resolved: "light" | "dark"; setPref: (p: ThemePref) => void }>({ pref: "system", resolved: "light", setPref: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const apply = useCallback((p: ThemePref) => {
    const dark = p === "dark" || (p === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    setResolved(dark ? "dark" : "light");
  }, []);

  useEffect(() => {
    let stored: ThemePref = "system";
    try {
      stored = (localStorage.getItem(KEY) as ThemePref) || "system";
    } catch {}
    setPrefState(stored);
    apply(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let p: ThemePref = "system";
      try {
        p = (localStorage.getItem(KEY) as ThemePref) || "system";
      } catch {}
      if (p === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const setPref = useCallback(
    (p: ThemePref) => {
      try {
        localStorage.setItem(KEY, p);
      } catch {}
      setPrefState(p);
      apply(p);
    },
    [apply],
  );

  return <Ctx.Provider value={{ pref, resolved, setPref }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
