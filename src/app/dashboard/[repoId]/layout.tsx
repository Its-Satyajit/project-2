"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";

const pageVariants = {
	initial: {
		opacity: 0,
		y: 8,
	},
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.2,
			ease: "easeOut" as const,
		},
	},
	exit: {
		opacity: 0,
		y: -8,
		transition: {
			duration: 0.15,
			ease: "easeIn" as const,
		},
	},
};

function PageWrapper({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			animate="animate"
			exit="exit"
			initial="initial"
			variants={pageVariants}
		>
			{children}
		</motion.div>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense fallback={null}>
			<PageWrapper>{children}</PageWrapper>
		</Suspense>
	);
}
