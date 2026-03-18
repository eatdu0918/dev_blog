/**
 * src/examples/use-case-example.ts
 * 
 * 유스케이스(Use Case)를 코드로 형상화해본 예제입니다.
 * 단순히 함수 하나로 끝내는 것이 아니라, 사용자의 '목표'와 '시스템의 상호작용'을 
 * 명확한 객체 또는 함수 단위로 캡슐화하는 시도를 해보았습니다.
 */

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface CommentRepository {
  save(comment: Comment): Promise<void>;
}

// 유스케이스 입력 데이터 (Request DTO)
interface CreateCommentRequest {
  postId: string;
  author: string;
  content: string;
}

// 유스케이스 인터페이스: 시스템이 제공하는 하나의 '기능'을 정의
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * '댓글 작성' 유스케이스 구현체
 * 액터(사용자)가 댓글을 작성하려는 목표를 달성하기 위한 시나리오를 담고 있습니다.
 */
export class CreateCommentUseCase implements UseCase<CreateCommentRequest, Comment> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(request: CreateCommentRequest): Promise<Comment> {
    // 1. 유효성 검사 (시스템 비즈니스 규칙)
    if (!request.content.trim()) {
      throw new Error('댓글 내용은 비어 있을 수 없습니다.');
    }

    if (request.content.length > 500) {
      throw new Error('댓글은 500자 이내로 작성해야 합니다.');
    }

    // 2. 도메인 객체 생성
    const comment: Comment = {
      id: Math.random().toString(36).substring(2, 11),
      postId: request.postId,
      author: request.author,
      content: request.content,
      createdAt: new Date(),
    };

    // 3. 시스템의 상태 변경 (저장)
    await this.commentRepository.save(comment);

    // 4. 결과 반환
    return comment;
  }
}
