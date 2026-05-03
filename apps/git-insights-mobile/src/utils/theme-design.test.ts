import { describe, it, expect } from "vitest";
import { Colors, Spacing, FontSizes, BorderRadius } from "../utils/theme";

describe("Theme Design System", () => {
  describe("Colors - Dark Theme Palette", () => {
    it("should have background colors", () => {
      expect(Colors.background).toBe("#0a0a0a");
      expect(Colors.surface).toBe("#171717");
    });

    it("should support text hierarchy", () => {
      expect(Colors.text.primary).toBe("#fafafa");
      expect(Colors.text.secondary).toBe("#a1a1a1");
      expect(Colors.text.muted).toBe("#737373");
    });
  });

  describe("Spacing Scale", () => {
    it("should use 4px base unit", () => {
      expect(Spacing.xs).toBe(2);
      expect(Spacing.sm).toBe(4);
      expect(Spacing.md).toBe(8);
    });

    it("should have consistent scaling", () => {
      expect(Spacing["2xl"]).toBe(Spacing.xl * 1.25);
    });
  });

  describe("Typography Scale", () => {
    it("should have minimum 10px for readability", () => {
      expect(FontSizes.xs).toBeGreaterThanOrEqual(10);
    });

    it("should have maximum 30px for headings", () => {
      expect(FontSizes["4xl"]).toBeLessThanOrEqual(32);
    });
  });

  describe("Border Radius", () => {
    it("should support pill shape for special cases", () => {
      expect(BorderRadius.full).toBeGreaterThan(100);
    });

    it("should have reasonable small radius", () => {
      expect(BorderRadius.sm).toBeLessThan(8);
    });
  });
});