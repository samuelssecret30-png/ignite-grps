import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: [
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
				Bun: "readonly",
			},
		},
		rules: {
			"no-unused-vars": "off",
			"no-empty": ["error", { allowEmptyCatch: true }],
		},
	},
	{
		files: ["public/assets/js/ignite*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				toast: "readonly",
				ScramjetController: "readonly",
				scramjet: "readonly",
			},
		},
		rules: {
			"no-unused-vars": "off",
			"no-empty": ["error", { allowEmptyCatch: true }],
			"no-undef": "off",
			"no-useless-escape": "off",
		},
	},
]);
