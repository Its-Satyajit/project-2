import { describe, it, expect } from "vitest";
import { Colors, Spacing, FontSizes, BorderRadius } from "../utils/theme";

describe("Theme", () => {
  describe("Colors", () => {
    it("should have required color properties", () => {
      expect(Colors.background).toBe("#0a0a0a");
      expect(Colors.surface).toBe("#171717");
      expect(Colors.border).toBe("#404040");
    });

    it("should have text colors defined", () => {
      expect(Colors.text.primary).toBe("#fafafa");
      expect(Colors.text.secondary).toBe("#a1a1a1");
      expect(Colors.text.muted).toBe("#737373");
    });

    it("should have accent colors defined", () => {
      expect(Colors.accent.primary).toBe("#22c55e");
      expect(Colors.accent.secondary).toBe("#16a34a");
    });

    it("should have chart colors defined", () => {
      expect(Colors.chart.green).toBe("#22c55e");
      expect(Colors.chart.blue).toBe("#3b82f6");
      expect(Colors.chart.purple).toBe("#a855f7");
      expect(Colors.chart.orange).toBe("#f97316");
      expect(Colors.chart.red).toBe("#ef4444");
    });

    it("should have status colors defined", () => {
      expect(Colors.status.success).toBe("#22c55e");
      expect(Colors.status.warning).toBe("#eab308");
      expect(Colors.status.error).toBe("#ef4444");
      expect(Colors.status.info).toBe("#3b82f6");
    });
  });

  describe("Spacing", () => {
    it("should have spacing values", () => {
      expect(Spacing.xs).toBe(2);
      expect(Spacing.sm).toBe(4);
      expect(Spacing.md).toBe(8);
      expect(Spacing.lg).toBe(12);
      expect(Spacing.xl).toBe(16);
      expect(Spacing["2xl"]).toBe(20);
      expect(Spacing["3xl"]).toBe(24);
      expect(Spacing["4xl"]).toBe(32);
    });

    it("should be in ascending order", () => {
      expect(Spacing.sm).toBeGreaterThan(Spacing.xs);
      expect(Spacing.md).toBeGreaterThan(Spacing.sm);
      expect(Spacing.lg).toBeGreaterThan(Spacing.md);
      expect(Spacing.xl).toBeGreaterThan(Spacing.lg);
    });
  });

  describe("FontSizes", () => {
    it("should have font size values", () => {
      expect(FontSizes.xs).toBe(10);
      expect(FontSizes.sm).toBe(12);
      expect(FontSizes.md).toBe(14);
      expect(FontSizes.lg).toBe(16);
      expect(FontSizes.xl).toBe(18);
      expect(FontSizes["2xl"]).toBe(22);
      expect(FontSizes["3xl"]).toBe(26);
      expect(FontSizes["4xl"]).toBe(30);
    });

    it("should be in ascending order", () => {
      expect(FontSizes.sm).toBeGreaterThan(FontSizes.xs);
      expect(FontSizes.md).toBeGreaterThan(FontSizes.sm);
      expect(FontSizes.lg).toBeGreaterThan(FontSizes.md);
    });
  });

  describe("BorderRadius", () => {
    it("should have border radius values", () => {
      expect(BorderRadius.sm).toBe(4);
      expect(BorderRadius.md).toBe(8);
      expect(BorderRadius.lg).toBe(12);
      expect(BorderRadius.xl).toBe(16);
      expect(BorderRadius.full).toBe(9999);
    });

    it("should have reasonable values", () => {
      expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
      expect(BorderRadius.lg).toBeLessThan(BorderRadius.xl);
      expect(BorderRadius.full).toBeGreaterThan(100);
    });
  });
});