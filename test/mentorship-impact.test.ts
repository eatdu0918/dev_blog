/* test/mentorship-impact.test.ts */
import { describe, test, expect } from 'vitest';
import { IndividualDeveloper, MentorDeveloper } from '../src/examples/mentorship-pattern';

describe('Mentorship Impact Test', () => {
    test('단순 개발자 2명이 따로 일할 때보다, 한 명의 조력자가 다른 한 명을 가이드할 때 전체 팀 생산성이 어떠한지 검증합니다.', () => {
        // 1. 단순 개별 개발자 (생산성 100씩)
        const activeDev = new IndividualDeveloper('Dev A', 100);
        const soloDev = new IndividualDeveloper('Dev B', 100);
        const soloTotal = activeDev.writeCode() + soloDev.writeCode(); // 100 + 100 = 200

        // 2. 조력자가 된 개발자가 다른 한 명을 가이드 (동일하게 생산성 100의 잠재력을 가짐)
        const facilitator = new MentorDeveloper('Facilitator C', 100);
        const learner = new IndividualDeveloper('Learner D', 100);
        facilitator.addMentee(learner);

        // 조력자의 기회 비용: 본인 생산성은 100 * 0.6 = 60
        // 팀원의 부스트: 100 * (1 + 0.4) = 140
        // 전체 팀의 성과: 60 + 140 = 200 (개인 생산성이 줄었지만 팀 전체는 동일하게 유지됨)
        // 조력자의 영향력이 미치는 범위가 2명 이상으로 늘어난다면 팀 성과는 비약적으로 늘어납니다.

        expect(facilitator.calculateTeamImpact()).toBe(200);

        // 3. 2명의 팀원을 가이드하는 경우
        const learnerE = new IndividualDeveloper('Learner E', 100);
        facilitator.addMentee(learnerE);

        // 조력자의 기회 비용: 60
        // 팀원 1의 부스트: 140
        // 팀원 2의 부스트: 140
        // 전체 팀의 성과: 60 + 140 + 140 = 340
        // 개별 개발자 3명 (100 + 100 + 100 = 300) 보다 훨씬 높은 생산성을 증명합니다.

        expect(facilitator.calculateTeamImpact()).toBe(340);
    });
});
