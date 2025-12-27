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

  eleventyConfig.addGlobalData("permalink", "{{ page.filePathStem }}.html");

  eleventyConfig.addFilter("cssmin", function(code) {
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
      const minified = await minify(code);
      callback(null, minified.code);
    } catch (err) {
      console.error("Terser error: ", err);
      callback(null, code);
    }
  });

  eleventyConfig.addTransform("htmlmin", function(content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true, // Also minifies JS inside <script> tags
        minifyCSS: false // Also minifies CSS inside <style> tags
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