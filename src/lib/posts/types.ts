export interface PostMetadata {
    id: string;
    date: string;
    title: string;
    categories?: string[];
    published?: boolean;
    type?: 'post' | 'qna';
    level?: 'junior' | 'mid' | 'senior' | string;
    [key: string]: unknown;
}

export interface PostContent extends PostMetadata {
    contentHtml: string;
}
