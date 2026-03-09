/**
 * requestAnimationFrame을 이용한 간단한 애니메이션 함수 예시
 */
export function animate(
    element: { style: { transform: string } },
    duration: number,
    distance: number,
    requestAnimationFrame: (callback: FrameRequestCallback) => number
) {
    let start: number | null = null;

    function step(timestamp: number) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const currentPos = Math.min((progress / duration) * distance, distance);

        element.style.transform = `translateX(${currentPos}px)`;

        if (progress < duration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}
