// Shared type for all itemised content in Skier pipelines

export interface SkierItem {
  section?: string;
  itemName: string;
  itemPath: string;
  outPath: string;
  type: string; // 'html', 'md', etc.
  title?: string;
  link?: string;
  excerpt?: string;
  body?: string;
  date?: string;
  dateObj?: Date;
  dateNum?: number;
  [key: string]: any; // Allow extension by user/frontmatter
}
