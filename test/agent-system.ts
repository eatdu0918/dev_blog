/**
 * 에이전트의 규칙(Rule)과 기술(Skill)을 관리하는 간단한 시스템 데모
 */

export interface Rule {
    id: string;
    description: string;
    enforce: (content: string) => boolean;
}

export interface Skill {
    name: string;
    execute: (input: any) => string;
}

export class Agent {
    private rules: Rule[] = [];
    private skills: Map<string, Skill> = new Map();

    addRule(rule: Rule) {
        this.rules.push(rule);
    }

    addSkill(skill: Skill) {
        this.skills.set(skill.name, skill);
    }

    processTask(taskName: string, content: string): string {
        // 규칙 검증 (Order)
        for (const rule of this.rules) {
            if (!rule.enforce(content)) {
                throw new Error(`규칙 위반: ${rule.description}`);
            }
        }

        // 기술 사용 (Capabilities)
        const skill = this.skills.get(taskName);
        if (!skill) {
            return `수행할 수 없는 기술입니다: ${taskName}`;
        }

        return skill.execute(content);
    }
}
