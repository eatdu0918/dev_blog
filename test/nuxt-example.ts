/**
 * Nuxt 3의 Composables 패턴을 모사한 간단한 상태 관리 및 데이터 패칭 유틸리티입니다.
 * 실제 Nuxt 환경이 아니더라도 로직을 검증할 수 있도록 독립적으로 구현되었습니다.
 */

export interface Post {
    id: number;
    title: string;
    body: string;
}

/**
 * Nuxt의 Auto-imports 패턴처럼 사용할 수 있는 간단한 데이터 저장소입니다.
 */
export const usePostStore = () => {
    const posts = new Map<number, Post>();

    const addPost = (post: Post) => {
        posts.set(post.id, post);
    };

    const getPost = (id: number) => {
        return posts.get(id);
    };

    const getAllPosts = () => {
        return Array.from(posts.values());
    };

    return {
        addPost,
        getPost,
        getAllPosts,
    };
};

/**
 * Nuxt 3의 useFetch와 유사한 비동기 데이터 로더 로직입니다.
 */
export const createMockFetcher = (mockData: Post[]) => {
    return async (id: number): Promise<{ data: Post | null; error: string | null }> => {
        // 실제 네트워크 요청 지연을 모사합니다.
        await new Promise((resolve) => setTimeout(resolve, 50));

        const post = mockData.find((p) => p.id === id);
        if (post) {
            return { data: post, error: null };
        }
        return { data: null, error: 'Post not found' };
    };
};
