export interface Video {
  title: string;
  embedUrl: string;
  platform: "youtube" | "vimeo";
  date?: string;
  description?: string;
}

export const videos: Video[] = [
  // Populate from YouTube/Vimeo — use embed URLs
  // YouTube: https://www.youtube.com/embed/VIDEO_ID
  // Vimeo:   https://player.vimeo.com/video/VIDEO_ID
];
