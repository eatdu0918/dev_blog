export interface PostMetadata {
    id: string;
    date: string;
    title: string;
    categories?: string[];
    published?: boolean;
    [key: string]: unknown;
}

export interface PostContent extends PostMetadata {
    contentHtml: string;
}
