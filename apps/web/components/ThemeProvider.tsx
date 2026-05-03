"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: Theme) {
	const resolved = theme === "system" ? getSystemTheme() : theme;
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Load saved theme from localStorage
		const saved = localStorage.getItem("theme") as Theme | null;
		const initial = saved || "system";
		setThemeState(initial);
		setResolvedTheme(initial === "system" ? getSystemTheme() : initial);
		applyTheme(initial);
		setMounted(true);

		// Listen for system theme changes
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			if (theme === "system") {
				setResolvedTheme(getSystemTheme());
				applyTheme("system");
			}
		};
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		setResolvedTheme(newTheme === "system" ? getSystemTheme() : newTheme);
		localStorage.setItem("theme", newTheme);
		applyTheme(newTheme);
	};

	// Prevent flash by not rendering until mounted
	if (!mounted) {
		return (
			<ThemeContext.Provider
				value={{ theme: "system", setTheme, resolvedTheme: "light" }}
			>
				{children}
			</ThemeContext.Provider>
		);
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
