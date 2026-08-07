/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist 是 ESM 且包含 worker / 可选原生依赖，
  // 标记为外部包避免被 Turbopack 打包进 server bundle。
  serverExternalPackages: ["pdfjs-dist"],
};

module.exports = nextConfig;
