import { useEffect, useRef } from "react";
import { HeaderConfig, useHeaderStore } from "@/store/header-store";
import { useIsFocused } from "@react-navigation/native";

// Simplified: we only keep a single current header config now.
export function useHeader(config: HeaderConfig) {
  const setCurrent = useHeaderStore((s) => s.setCurrent);
  const reset = useHeaderStore((s) => s.reset);
  const isFocused = useIsFocused();
  const lastApplied = useRef<HeaderConfig | null>(null);

  useEffect(() => {
    if (isFocused && lastApplied.current !== config) {
      setCurrent(config);
      lastApplied.current = config;
    }
  }, [isFocused, config, setCurrent]);

  useEffect(() => {
    return () => {
      if (lastApplied.current === config) {
        reset();
      }
    };
  }, [config, reset]);
}
