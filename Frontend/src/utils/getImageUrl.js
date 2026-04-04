export default function getImageUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
