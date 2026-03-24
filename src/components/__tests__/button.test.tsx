import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../ui/button";

describe("Button", () => {
	it("should render with text", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
	});

	it("should apply default variant classes", () => {
		render(<Button>Default</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-primary");
	});

	it("should apply outline variant classes", () => {
		render(<Button variant="outline">Outline</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("border-border");
	});

	it("should apply secondary variant classes", () => {
		render(<Button variant="secondary">Secondary</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-secondary");
	});

	it("should apply ghost variant classes", () => {
		render(<Button variant="ghost">Ghost</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("hover:bg-muted");
	});

	it("should apply destructive variant classes", () => {
		render(<Button variant="destructive">Delete</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("bg-destructive/10");
	});

	it("should apply link variant classes", () => {
		render(<Button variant="link">Link</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("text-primary");
	});

	it("should apply size classes", () => {
		const { rerender } = render(<Button size="xs">Extra Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-6");

		rerender(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-7");

		rerender(<Button size="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-8");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9");
	});

	it("should apply icon size classes", () => {
		const { rerender } = render(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toHaveClass("size-8");

		rerender(<Button size="icon-xs">Icon XS</Button>);
		expect(screen.getByRole("button")).toHaveClass("size-6");

		rerender(<Button size="icon-sm">Icon SM</Button>);
		expect(screen.getByRole("button")).toHaveClass("size-7");

		rerender(<Button size="icon-lg">Icon LG</Button>);
		expect(screen.getByRole("button")).toHaveClass("size-9");
	});

	it("should apply custom className", () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("should be disabled when disabled prop is true", () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		expect(button).toHaveClass("disabled:pointer-events-none");
	});

	it("should have data-slot attribute", () => {
		render(<Button>Slot</Button>);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("data-slot", "button");
	});
});
