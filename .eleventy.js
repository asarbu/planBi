const { transform } = require("lightningcss");
const htmlmin = require("html-minifier-terser");
const { minify } = require("terser");

module.exports = function(eleventyConfig) {
	// 1. Tell 11ty to ignore the output folder
	eleventyConfig.ignores.add("_site");

	// 2. Pass through Cloudflare-specific files/folders
	// This ensures your Functions and CF config files move to the build
	eleventyConfig.addPassthroughCopy("functions");
	eleventyConfig.addPassthroughCopy("images");
	eleventyConfig.addPassthroughCopy("static");
	eleventyConfig.addPassthroughCopy({ "src/_includes/static": "static" });

	eleventyConfig.addGlobalData("permalink", "{{ page.filePathStem }}.html");

	const isProduction = process.env.NODE_ENV === "production";
	eleventyConfig.addFilter("cssmin", function(code) {
		if (!isProduction) { return code; }

		const filePath = this.page ? this.page.inputPath : "inline-style.css";
		let { code: minified } = transform({
			filename: filePath,
			code: Buffer.from(code, 'utf8'),
			minify: true,
			drafts: { nesting: true }
		});
		return minified.toString();
	});

	eleventyConfig.addNunjucksAsyncFilter("jsmin", async function(code, callback) {
		try {
			if (!isProduction) { return callback(null, code); }

			const minified = await minify(code, {
				compress: {
					drop_console: true
				}
			});
			callback(null, minified.code);
		} catch (err) {
			console.error("Terser error: ", err);
			callback(null, code);
		}
	});

	eleventyConfig.addTransform("htmlmin", function(content) {
		if (!isProduction) { return content; }
		if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true
			});
			return minified;
		}
		return content;
	});

	return {
		dir: {
			input: "src",
			output: "_site",   // Standard output for Cloudflare to pick up
			includes: "_includes" // Optional: where you keep layouts
		}
	};
};