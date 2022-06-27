const { resolve } = require("path");
const { writeFile, readdir } = require("fs/promises");
const ncc = require("@vercel/ncc");

const INPUT_DIR = resolve(__dirname, "..", "src");
const OUTPUT_DIR = resolve(__dirname, "..");

run(INPUT_DIR, OUTPUT_DIR);

async function run(inputDir, outputDir) {
  let files = await readdir(inputDir, {
    withFileTypes: true,
  });

  files = files.filter(
    (value) => !value.isDirectory() && value.name.endsWith(".mjs")
  );

  if (files.length === 0) return;

  await files.forEach((dirent) => {
    return ncc(resolve(inputDir, dirent.name), { minify: true }).then(
      ({ code }) => writeFile(resolve(outputDir, dirent.name), code, "utf-8")
    );
  });
}
