export type VersionMap = { [version: string]: { loaded: boolean } };

/**
 * Webpack Module Federation의 런타임 버전 협상(Dependency Negotiation) 로직을 단순화하여 구현한 학습용 시뮬레이션입니다.
 * 'singleton' 옵션과 'requiredVersion' 처리가 런타임에 어떻게 작동하는지 이해하기 위해 작성되었습니다.
 */
export function negotiateVersion(
  scope: { [lib: string]: VersionMap },
  libName: string,
  requiredVersion: string,
  options: { singleton?: boolean } = {}
): string {
  const versions = scope[libName];
  if (!versions) {
    throw new Error(`${libName} not found in share scope.`);
  }

  // 등록된 버전들을 정렬하여 가장 최신 버전부터 탐색
  const availableVersions = Object.keys(versions).sort((a, b) => {
    const vA = a.split('.').map(Number);
    const vB = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (vA[i] > vB[i]) return -1;
        if (vA[i] < vB[i]) return 1;
    }
    return 0;
  });

  // 싱글톤일 때는 연맹 전체에서 가장 높은 호환 버전을 단 하나만 선택 (단순화: 가장 높은 버전을 우선 반환)
  if (options.singleton) {
    return availableVersions[0];
  }

  // 일반적인 상황에서는 요구된 버전 범위(Caret 지원) 내에서 가장 높은 버전을 반환
  const majorRequired = requiredVersion.replace('^', '').split('.')[0];
  const matched = availableVersions.find((v) => {
    const vMajor = v.split('.')[0];
    return vMajor === majorRequired;
  });

  if (!matched) {
    throw new Error(`Incompatible version for ${libName}@${requiredVersion}. Available: ${availableVersions.join(', ')}`);
  }

  return matched;
}
