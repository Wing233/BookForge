import "./globals.css";

export const metadata = {
  title: "练习册生成器",
  description: "上传 PDF，在线逐节生成练习册",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
