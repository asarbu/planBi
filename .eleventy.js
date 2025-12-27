module.exports = function(eleventyConfig) {
  // 1. Tell 11ty to ignore the output folder
  eleventyConfig.ignores.add("_site");

  // 2. Pass through Cloudflare-specific files/folders
  // This ensures your Functions and CF config files move to the build
  eleventyConfig.addPassthroughCopy("functions");
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("images");

  eleventyConfig.addGlobalData("permalink", "{{ page.filePathStem }}.html");

  return {
    dir: {
      input: "src",
      output: "_site",   // Standard output for Cloudflare to pick up
      includes: "_includes" // Optional: where you keep layouts
    }
  };
};