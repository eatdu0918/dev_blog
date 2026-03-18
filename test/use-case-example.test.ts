import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCommentUseCase } from '../src/examples/use-case-example';

describe('CreateCommentUseCase (유스케이스 탐색)', () => {
  // Mock Repository
  const mockRepository = {
    save: vi.fn().mockResolvedValue(undefined),
  };

  const useCase = new CreateCommentUseCase(mockRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자가 올바른 내용을 입력하면 댓글이 성공적으로 생성되어야 합니다.', async () => {
    const request = {
      postId: 'post-123',
      author: '길동',
      content: '유스케이스 학습 중입니다. 유익하네요!',
    };

    const result = await useCase.execute(request);

    // 검증
    expect(result.id).toBeDefined();
    expect(result.content).toBe(request.content);
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('댓글 내용이 비어 있으면 에러를 발생시켜야 합니다.', async () => {
    const request = {
      postId: 'post-123',
      author: '길동',
      content: '',
    };

    // 검증
    await expect(useCase.execute(request)).rejects.toThrow('댓글 내용은 비어 있을 수 없습니다.');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('댓글 내용이 너무 길면 에러를 발생시켜야 합니다.', async () => {
    const request = {
      postId: 'post-123',
      author: '길동',
      content: 'a'.repeat(501),
    };

    // 검증
    await expect(useCase.execute(request)).rejects.toThrow('댓글은 500자 이내로 작성해야 합니다.');
  });
});
