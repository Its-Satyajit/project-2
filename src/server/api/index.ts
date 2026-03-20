import Elysia from "elysia";

export const apiHandler = new Elysia().get(
	"/hello-elysia",
	() => {
		return "🦊 I am Alive,";
	},
	{},
);
