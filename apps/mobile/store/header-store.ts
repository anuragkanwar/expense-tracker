import { create } from "zustand";
import React from "react";

export type HeaderSlotNode = React.ReactNode;

export type HeaderConfig = {
  title?: string;
  left?: HeaderSlotNode;
  center?: HeaderSlotNode;
  right?: HeaderSlotNode;
  bottom?: HeaderSlotNode;
  showBack?: boolean;
  backgroundColor?: string;
};

interface HeaderState {
  current: HeaderConfig;
  setCurrent: (cfg: HeaderConfig) => void;
  reset: () => void;
}

const empty: HeaderConfig = {};

export const useHeaderStore = create<HeaderState>((set) => ({
  current: empty,
  setCurrent: (cfg) =>
    set((state) => {
      const prev = state.current;
      const same =
        prev.title === cfg.title &&
        prev.showBack === cfg.showBack &&
        prev.backgroundColor === cfg.backgroundColor &&
        prev.left === cfg.left &&
        prev.center === cfg.center &&
        prev.right === cfg.right &&
        prev.bottom === cfg.bottom;
      if (same) return state;
      return { current: { ...cfg } };
    }),
  reset: () => set({ current: empty }),
}));
