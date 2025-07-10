export interface Article {
  title: string;
  filename: string;
  status: 'draft' | 'published' | 'updated' | 'error' | 'publishing';
  wpId: number | null;
  lastUpdated: string | null;
  tags: string[];
  category: string;
}

export interface ArticleContent {
  title: string;
  content: string;
  tags: string[];
  category: string;
  metaDescription: string;
  featuredImage: string;
  author: string;
  dateCreated: string;
  wordCount: number;
}