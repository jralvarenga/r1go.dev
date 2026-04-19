export {};

declare global {
  interface Window {
    __r1goApplyTheme?: (theme: "light" | "dark", root?: Element | null) => void;
    __r1goGetTheme?: () => "light" | "dark";
    __r1goRevealObservers?: IntersectionObserver[];
    __r1goRevealSetup?: boolean;
    __r1goSoftNavigated?: boolean;
    __r1goLanguageSwitcherSetup?: boolean;
    __r1goThemeSyncSetup?: boolean;
    __r1goThemeToggleSetup?: boolean;
    __r1goThemeTransitionRunning?: boolean;
  }
}
