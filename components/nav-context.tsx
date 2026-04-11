"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type NavCtx = {
  contextLine: string | null;
  setContextLine: (v: string | null) => void;
};

const NavContext = createContext<NavCtx | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [contextLine, setContextLine] = useState<string | null>(null);
  const value = useMemo(
    () => ({ contextLine, setContextLine }),
    [contextLine]
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavContext() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error("useNavContext must be used within NavProvider");
  }
  return ctx;
}

/** Sets the third nav line (“where we are”). Clears on unmount. */
export function SetNavContextLine({ line }: { line: string | null }) {
  const { setContextLine } = useNavContext();
  useEffect(() => {
    setContextLine(line);
    return () => setContextLine(null);
  }, [line, setContextLine]);
  return null;
}
