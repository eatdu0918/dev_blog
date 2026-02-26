export interface PostMetadata {
    id: string;
    date: string;
    title: string;
    categories?: string[];
    published?: boolean;
    [key: string]: any;
}

export interface PostContent extends PostMetadata {
    contentHtml: string;
}
