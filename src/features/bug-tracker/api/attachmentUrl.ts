import { AppConfig } from "@/shared/infrastructure/AppConfig";

// No fallback host: without VITE_ADMIN_API_URL the link stays relative to the
// page, instead of pointing at a server on the viewer's own machine (UX-34)
export const attachmentUrl = (filePath: string) =>
  `${AppConfig.ADMIN_API_URL}${filePath}`;
