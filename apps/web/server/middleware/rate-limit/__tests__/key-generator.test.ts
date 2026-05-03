import { describe, expect, it } from "vitest";
import { KeyGenerator } from "../key-generator";

describe("KeyGenerator", () => {
	describe("isIPv6", () => {
		it("should identify valid IPv6 addresses", () => {
			expect(
				KeyGenerator.isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334"),
			).toBe(true);
			expect(KeyGenerator.isIPv6("fe80::1")).toBe(true);
			expect(KeyGenerator.isIPv6("::1")).toBe(true);
			expect(KeyGenerator.isIPv6("::")).toBe(true);
		});

		it("should reject IPv4 addresses", () => {
			expect(KeyGenerator.isIPv6("192.168.1.1")).toBe(false);
			expect(KeyGenerator.isIPv6("10.0.0.1")).toBe(false);
		});

		it("should reject IPv4-mapped IPv6", () => {
			expect(KeyGenerator.isIPv6("::ffff:192.168.1.1")).toBe(false);
		});
	});

	describe("expandIPv6", () => {
		it("should expand compressed IPv6 addresses", () => {
			expect(KeyGenerator.expandIPv6("::1")).toBe("0:0:0:0:0:0:0:1");
			expect(KeyGenerator.expandIPv6("fe80::1")).toBe("fe80:0:0:0:0:0:0:1");
			expect(KeyGenerator.expandIPv6("::")).toBe("0:0:0:0:0:0:0:0");
			expect(KeyGenerator.expandIPv6("2001:db8::1")).toBe(
				"2001:db8:0:0:0:0:0:1",
			);
		});

		it("should keep full IPv6 unchanged", () => {
			const full = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
			expect(KeyGenerator.expandIPv6(full)).toBe(full);
		});
	});

	describe("getIPv6Prefix64", () => {
		it("should extract /64 prefix from IPv6 addresses", () => {
			expect(KeyGenerator.getIPv6Prefix64("2001:db8::1")).toBe(
				"2001:0db8:0000:0000",
			);
			expect(KeyGenerator.getIPv6Prefix64("fe80::1")).toBe(
				"fe80:0000:0000:0000",
			);
			expect(KeyGenerator.getIPv6Prefix64("::1")).toBe("0000:0000:0000:0000");
			expect(
				KeyGenerator.getIPv6Prefix64("2001:0db8:85a3:1234:5678:9abc:def0:1234"),
			).toBe("2001:0db8:85a3:1234");
		});
	});

	describe("normalizeIp", () => {
		it("should return IPv4 as-is", () => {
			expect(KeyGenerator.normalizeIp("192.168.1.1")).toBe("192.168.1.1");
			expect(KeyGenerator.normalizeIp("10.0.0.1")).toBe("10.0.0.1");
		});

		it("should convert IPv4-mapped IPv6 to IPv4", () => {
			expect(KeyGenerator.normalizeIp("::ffff:192.168.1.1")).toBe(
				"192.168.1.1",
			);
			expect(KeyGenerator.normalizeIp("::ffff:10.0.0.1")).toBe("10.0.0.1");
		});

		it("should normalize IPv6 to /64 prefix", () => {
			expect(KeyGenerator.normalizeIp("2001:db8::1")).toBe(
				"2001:0db8:0000:0000",
			);
			expect(KeyGenerator.normalizeIp("fe80::1")).toBe("fe80:0000:0000:0000");
		});

		it("should trim whitespace", () => {
			expect(KeyGenerator.normalizeIp("  192.168.1.1  ")).toBe("192.168.1.1");
		});
	});

	describe("getIdentifier", () => {
		it("should return user ID for authenticated requests", () => {
			const mockContext = {
				request: { headers: new Headers() },
				user: { id: "user123", email: "test@example.com" },
			} as unknown as Parameters<typeof KeyGenerator.getIdentifier>[0];

			expect(KeyGenerator.getIdentifier(mockContext)).toBe("user:user123");
		});

		it("should return IP for unauthenticated requests", () => {
			const mockContext = {
				request: { headers: new Headers() },
				ip: "192.168.1.1",
			} as unknown as Parameters<typeof KeyGenerator.getIdentifier>[0];

			expect(KeyGenerator.getIdentifier(mockContext)).toBe("ip:192.168.1.1");
		});

		it("should prefer X-Forwarded-For header", () => {
			const headers = new Headers();
			headers.set("x-forwarded-for", "10.0.0.1, 192.168.1.1");
			const mockContext = {
				request: { headers },
			} as unknown as Parameters<typeof KeyGenerator.getIdentifier>[0];

			expect(KeyGenerator.getIdentifier(mockContext)).toBe("ip:10.0.0.1");
		});

		it("should prefer X-Real-IP header", () => {
			const headers = new Headers();
			headers.set("x-real-ip", "10.0.0.2");
			const mockContext = {
				request: { headers },
			} as unknown as Parameters<typeof KeyGenerator.getIdentifier>[0];

			expect(KeyGenerator.getIdentifier(mockContext)).toBe("ip:10.0.0.2");
		});

		it("should prefer CF-Connecting-IP header", () => {
			const headers = new Headers();
			headers.set("cf-connecting-ip", "10.0.0.3");
			const mockContext = {
				request: { headers },
			} as unknown as Parameters<typeof KeyGenerator.getIdentifier>[0];

			expect(KeyGenerator.getIdentifier(mockContext)).toBe("ip:10.0.0.3");
		});
	});
});
