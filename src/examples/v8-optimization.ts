/**
 * 객체의 구조가 일관될 때 V8은 이를 최적화하기 더 쉽다는 점을 학습했습니다.
 * 같은 순서로 속성이 추가된 객체들은 같은 'Hidden Class'를 공유하게 됩니다.
 */
class Point {
    constructor(public x: number, public y: number) {}
}

export function performHeavyCalculation() {
    const points: Point[] = [];
    
    // 1. 일관된 타입/모양의 객체 생성 (V8 최적화에 유리한 패턴)
    for (let i = 0; i < 10000; i++) {
        points.push(new Point(i, i + 1));
    }

    /**
     * 만약 여기서 중간에 객체의 모양을 바꾸거나 속성을 동적으로 추가하면
     * V8의 최적화 흐름(TurboFan)이 깨지고 다시 인터프리터(Ignition) 상태로 
     * 돌아가는 'Deoptimization'이 발생할 수 있음을 배웠습니다.
     * 예: points[5000].z = 100;
     */

    return points.reduce((acc, p) => acc + p.x + p.y, 0);
}
