import { expect, test, describe } from 'vitest';
import { Agent, Rule, Skill } from './agent-system';

describe('Agent System Demo', () => {
    test('규칙 엄수 및 기술 실행 테스트', () => {
        const agent = new Agent();

        // 1. 규칙 추가: "한국어만 사용해야 함"
        const koreanOnlyRule: Rule = {
            id: 'korean-only',
            description: '모든 응답은 한국어여야 합니다.',
            enforce: (content) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content),
        };
        agent.addRule(koreanOnlyRule);

        // 2. 기술 추가: "글 요약"
        const summarizerSkill: Skill = {
            name: 'summarize',
            execute: (input) => `[요약 완료] ${input.substring(0, 10)}...`,
        };
        agent.addSkill(summarizerSkill);

        // 정상 케이스
        const result = agent.processTask('summarize', '안녕하세요, 에이전트 시스템 테스트입니다.');
        expect(result).toContain('[요약 완료]');

        // 규칙 위반 케이스 (영문만 있는 경우)
        expect(() => {
            agent.processTask('summarize', 'Hello, this should fail.');
        }).toThrow('규칙 위반: 모든 응답은 한국어여야 합니다.');
    });
});
