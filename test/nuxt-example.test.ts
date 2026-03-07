import { describe, it, expect } from 'vitest';
import { usePostStore, createMockFetcher, Post } from './nuxt-example';

describe('Nuxt-style Composables Logic', () => {
    it('usePostStore should store and retrieve posts correctly', () => {
        const { addPost, getPost } = usePostStore();
        const mockPost: Post = { id: 1, title: 'Nuxt 3 Intro', body: 'Nuxt is awesome' };

        addPost(mockPost);
        expect(getPost(1)).toEqual(mockPost);
        expect(getPost(2)).toBeUndefined();
    });

    it('createMockFetcher should simulate async data fetching like useFetch', async () => {
        const mockData: Post[] = [
            { id: 1, title: 'Nuxt 3 Intro', body: 'Nuxt is awesome' },
            { id: 2, title: 'Nitro Engine', body: 'Nitro is fast' },
        ];
        const fetchPost = createMockFetcher(mockData);

        const { data: post1, error: error1 } = await fetchPost(1);
        expect(post1).toEqual(mockData[0]);
        expect(error1).toBeNull();

        const { data: post3, error: error3 } = await fetchPost(3);
        expect(post3).toBeNull();
        expect(error3).toBe('Post not found');
    });
});
