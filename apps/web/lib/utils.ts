import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getHotspotColor(score: number): string {
	if (score === 0) return "#e5e7eb";
	const r = Math.round(255 - score * 155);
	const g = Math.round(200 - score * 150);
	const b = Math.round(50 - score * 50);
	return `rgb(${r},${g},${b})`;
}
