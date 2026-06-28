export function safeFilename(name: string) {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const base = name.replace(/\.[^.]+$/, "");
  const safe = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return ext ? `${safe || "file"}.${ext}` : safe || "file";
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
