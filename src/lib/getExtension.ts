export function getExtension(path?: string) {
	if (!path || !path.includes(".")) return "no-extension";

	const ext = path.split(".").pop();
	return ext ? ext.toLowerCase() : "no-extension";
}
