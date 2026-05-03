import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Colors, LightColors } from "../utils/theme";

const THEME_STORAGE_KEY = "theme_mode";

interface ThemeContextType {
	isDark: boolean;
	colors: any;
	toggleTheme: () => void;
	setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	isDark: true,
	colors: Colors,
	toggleTheme: () => {},
	setTheme: () => {},
});

export function useTheme() {
	return useContext(ThemeContext);
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 2,
		},
	},
});

export function Provider({ children }: { children: React.ReactNode }) {
	const [isDark, setIsDark] = useState(true);

	useEffect(() => {
		AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
			if (value !== null) {
				setIsDark(value === "dark");
			}
		});
	}, []);

	const colors = useMemo(() => (isDark ? Colors : LightColors), [isDark]);

	const toggleTheme = async () => {
		const newIsDark = !isDark;
		setIsDark(newIsDark);
		await AsyncStorage.setItem(THEME_STORAGE_KEY, newIsDark ? "dark" : "light");
	};

	const setTheme = async (dark: boolean) => {
		setIsDark(dark);
		await AsyncStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
	};

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme }}>
				{children}
			</ThemeContext.Provider>
		</QueryClientProvider>
	);
}
