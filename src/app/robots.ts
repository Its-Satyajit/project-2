import type { MetadataRoute } from "next";
import { env } from "~/env";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = env.NEXT_PUBLIC_BASE_URL;
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/"],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
