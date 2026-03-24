import type { Context } from "elysia";
import type { AuthenticatedContext } from "./types";

/**
 * Key Generator for Rate Limiting
 *
 * Implements hybrid identification:
 * - Authenticated users: user:{id}
 * - Anonymous IPv4: ip:{address}
 * - Anonymous IPv6: ip:{prefix64} (first 64 bits / /64 subnet)
 */
export class KeyGenerator {
	/**
	 * Generate a rate limit key from the request context
	 *
	 * @param context - Elysia request context
	 * @param endpoint - The endpoint being rate limited
	 * @returns Rate limit identifier string
	 */
	static generate(context: Context, endpoint: string): string {
		const identifier = KeyGenerator.getIdentifier(context);
		return `${endpoint}:${identifier}`;
	}

	/**
	 * Extract identifier from request context
	 * Prefers user ID if authenticated, falls back to IP
	 */
	static getIdentifier(context: Context): string {
		// Try to get authenticated user
		const userId = KeyGenerator.getUserId(context);
		if (userId) {
			return `user:${userId}`;
		}

		// Fall back to IP address
		const ip = KeyGenerator.getClientIp(context);
		return `ip:${ip}`;
	}

	/**
	 * Extract user ID from authenticated context
	 */
	static getUserId(context: Context): string | null {
		// Check if user is attached to context (from Better Auth)
		const authContext = context as AuthenticatedContext;
		if (authContext.user?.id) {
			return authContext.user.id;
		}

		// Check request headers for user ID (alternative auth methods)
		const userIdHeader = context.request.headers.get("x-user-id");
		if (userIdHeader) {
			return userIdHeader;
		}

		// Check for session/cookie-based auth
		const cookieHeader = context.request.headers.get("cookie");
		if (cookieHeader) {
			// Parse session cookie if using Better Auth
			const sessionMatch = cookieHeader.match(/session[_-]?id=([^;]+)/);
			if (sessionMatch?.[1]) {
				return sessionMatch[1];
			}
		}

		return null;
	}

	/**
	 * Extract client IP address from request
	 * Checks common proxy headers for correct IP
	 */
	static getClientIp(context: Context): string {
		const headers = context.request.headers;

		// Check X-Forwarded-For (first IP is the client)
		const forwardedFor = headers.get("x-forwarded-for");
		if (forwardedFor) {
			const ips = forwardedFor.split(",").map((ip) => ip.trim());
			const clientIp = ips[0];
			if (clientIp) {
				return KeyGenerator.normalizeIp(clientIp);
			}
		}

		// Check X-Real-IP
		const realIp = headers.get("x-real-ip");
		if (realIp) {
			return KeyGenerator.normalizeIp(realIp);
		}

		// Check CF-Connecting-IP (Cloudflare)
		const cfIp = headers.get("cf-connecting-ip");
		if (cfIp) {
			return KeyGenerator.normalizeIp(cfIp);
		}

		// Fallback to request IP (Elysia provides this)
		const requestIp =
			(context.request as unknown as { ip?: string }).ip ??
			(context as unknown as { ip?: string }).ip;
		if (requestIp) {
			return KeyGenerator.normalizeIp(requestIp);
		}

		// Last resort - unknown
		return "unknown";
	}

	/**
	 * Normalize IP address for rate limiting
	 * - IPv6 addresses use /64 prefix (first 64 bits)
	 * - IPv4 addresses are used as-is
	 * - IPv4-mapped IPv6 (::ffff:x.x.x.x) extracts IPv4
	 */
	static normalizeIp(ip: string): string {
		// Trim and validate
		const trimmedIp = ip.trim();

		// Handle IPv4-mapped IPv6 (::ffff:192.168.1.1)
		const ipv4MappedMatch = trimmedIp.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
		if (ipv4MappedMatch?.[1]) {
			return ipv4MappedMatch[1];
		}

		// Check if IPv6
		if (KeyGenerator.isIPv6(trimmedIp)) {
			return KeyGenerator.getIPv6Prefix64(trimmedIp);
		}

		// IPv4 or other format - return as-is
		return trimmedIp;
	}

	/**
	 * Check if address is IPv6
	 */
	static isIPv6(ip: string): boolean {
		// IPv6 contains colons
		if (!ip.includes(":")) {
			return false;
		}

		// IPv4-mapped IPv6 handled separately
		if (ip.toLowerCase().startsWith("::ffff:")) {
			return false;
		}

		// Standard IPv6 pattern
		const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
		return ipv6Pattern.test(ip) || ip === "::" || ip.startsWith("::");
	}

	/**
	 * Extract /64 prefix from IPv6 address
	 *
	 * IPv6 addresses are 128 bits, typically written as 8 groups of 4 hex digits.
	 * A /64 prefix is the first 4 groups (64 bits).
	 *
	 * Examples:
	 * - 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3:0000
	 * - fe80::1 -> fe80:0000:0000:0000
	 * - ::1 -> 0000:0000:0000:0000
	 */
	static getIPv6Prefix64(ip: string): string {
		// Expand compressed IPv6 to full form
		const expanded = KeyGenerator.expandIPv6(ip);

		// Take first 4 groups (64 bits)
		const groups = expanded.split(":");
		const prefixGroups = groups.slice(0, 4);

		// Pad each group to 4 digits
		const normalizedGroups = prefixGroups.map((g) =>
			g.padStart(4, "0").toLowerCase(),
		);

		return normalizedGroups.join(":");
	}

	/**
	 * Expand compressed IPv6 address to full 8-group form
	 *
	 * Examples:
	 * - ::1 -> 0000:0000:0000:0000:0000:0000:0000:0001
	 * - fe80::1 -> fe80:0000:0000:0000:0000:0000:0000:0001
	 * - 2001:db8::1 -> 2001:0db8:0000:0000:0000:0000:0000:0001
	 */
	static expandIPv6(ip: string): string {
		// Handle :: compression
		if (ip.includes("::")) {
			const parts = ip.split("::");
			const left = parts[0] ? parts[0].split(":") : [];
			const right = parts[1] ? parts[1].split(":") : [];
			const missing = 8 - left.length - right.length;
			const middle = Array(missing).fill("0");
			return [...left, ...middle, ...right].join(":");
		}
		return ip;
	}
}

/**
 * Default key generator function for use in rate limit config
 */
export function defaultKeyGenerator(context: Context): string {
	return KeyGenerator.getIdentifier(context);
}
