/* src/examples/mentorship-pattern.ts */
/**
 * 개발자가 성장하며 깨달은 협업의 가치를 코드로 표현해 보았습니다.
 * 단순히 자신의 생산성을 높이는 것을 넘어, 동료의 성장을 돕는 것이
 * 전체 프로젝트의 생산성에 어떤 영향을 주는지 보여주는 예시입니다.
 */

export interface Developer {
    name: string;
    baseProductivity: number;
    writeCode(): number;
}

/**
 * 묵묵히 기능을 구현하는 개발자
 */
export class IndividualDeveloper implements Developer {
    constructor(public name: string, public baseProductivity: number) { }

    writeCode(): number {
        // 자신의 역량만큼 코드를 작성합니다.
        return this.baseProductivity;
    }
}

/**
 * 동료의 성장을 돕는 '조력자(Facilitator)'로서의 역할을 수행하는 개발자
 */
export class MentorDeveloper implements Developer {
    private mentees: Developer[] = [];

    constructor(public name: string, public baseProductivity: number) { }

    addMentee(mentee: Developer) {
        this.mentees.push(mentee);
    }

    writeCode(): number {
        // 조력자는 팀 케어에 시간을 쓰느라 자신의 직접적인 코드 생산량은 다소 줄어들 수 있습니다.
        return this.baseProductivity * 0.6;
    }

    /**
     * 전체 팀의 결과물을 계산합니다. 
     * 조력자가 팀원들을 가이드할 때, 각 팀원의 생산성이 향상되는 것을 시뮬레이션합니다.
     */
    calculateTeamImpact(): number {
        const mentorshipBoost = 0.4; // 40% 생산성 향상 효과

        const menteesOutput = this.mentees.reduce((total, mentee) => {
            return total + (mentee.writeCode() * (1 + mentorshipBoost));
        }, 0);

        // 조력자 본인의 생산량 + 팀원들의 향상된 생산량 합계
        return menteesOutput + this.writeCode();
    }
}
