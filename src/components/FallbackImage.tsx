"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface FallbackImageProps
	extends Omit<ImageProps, "onError" | "onLoadError"> {
	onError?: () => void;
}

export function FallbackImage({ src, alt, ...props }: FallbackImageProps) {
	const [useFallback, setUseFallback] = useState(false);

	if (useFallback) {
		return <Image {...props} alt={alt} src={src} unoptimized />;
	}

	return (
		<Image
			{...props}
			alt={alt}
			onError={() => {
				setUseFallback(true);
				props.onError?.();
			}}
			src={src}
		/>
	);
}
