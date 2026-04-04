export interface Event {
  title: string;
  date: string;
  location: string;
  description?: string;
  link?: string;
}

export const events: Event[] = [
  // Populate from WordPress events section
];
