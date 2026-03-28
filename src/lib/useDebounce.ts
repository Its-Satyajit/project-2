import { useDebouncedValue } from "@tanstack/react-pacer";

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue] = useDebouncedValue(value, {
		wait: delay,
	});

	return debouncedValue;
}
