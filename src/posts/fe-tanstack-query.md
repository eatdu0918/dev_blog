---
published: true
title: "상태 관리 패러다임의 변화: useEffect에서 TanStack Query로"
description: "서버 데이터를 받아오기 위해 사용하던 useEffect 기반 패턴을 TanStack Query로 리팩토링하며 얻은 생산성 향상 경험을 공유합니다."
date: "2026-02-23"
tags: ["Frontend", "React"]
---

# 상태 관리 패러다임의 변화: useEffect에서 TanStack Query로

리액트를 다루면서 오랫동안 습관처럼 작성했던 API 호출 패턴이 있었습니다. 바로 `컴포넌트 마운트` -> `useEffect 호출` -> `로딩 상태 처리` -> `fetch` -> `결과를 useState에 저장`으로 이어지는 반복 작업이었습니다.

프로젝트의 화면 단위 컴포넌트가 점차 늘어남에 따라 서버 데이터 동기화 코드가 복잡하게 얽히기 시작했고, 성능을 위한 캐싱이나 데이터 무효화(Invalidation) 같은 기능은 직접 구현할 엄두도 내지 못했습니다. 이 한계를 극복하기 위해 **TanStack Query(React Query)**를 도입하여 프로젝트의 데이터 호출 흐름을 리팩토링했던 경험을 회고합니다.

---

## 🚨 기존 절차적 데이터 패칭의 고통

과거 상품 상세 페이지를 작업할 당시 작성했던 전형적인 컴포넌트 코드입니다.

```tsx
// 기존 장황하고 반복적인 구조
function ProductDetail({ id }: { id: number }) {
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`/api/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // UI 렌더링 로직 생략...
}
```
동일한 API를 불러오는 다른 페이지의 컴포넌트에서도 위와 같은 보일러플레이트 코드를 매번 작성해야 했으며, 불필요한 중복 호출 방지 메커니즘이 없어 이미 지나간 페이지를 뒤로 가기로 접근해도 로딩 스피너를 무조건 다시 마주해야 했습니다.

---

## ⚡ 뷰 노출 계층과 데이터 계층의 분리

TanStack Query를 도입한 뒤, 뷰 데이터를 구성하는 컴포넌트 내부의 흐름은 훨씬 선언적으로 변경되었습니다.

```tsx
function ProductDetail({ id }: { id: number }) {
    // API 데이터 호출, 캐싱, 로딩 및 에러 상태의 일괄 파생
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id], // 고유 캐시 식별자
        queryFn: () => getProduct(id),
        staleTime: 1000 * 60 * 5, // 캐싱 허용 제한 설정
    });

    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage />;

    return <div>{product.name}</div>;
}
```

### 도입 후 확인한 운영 상의 이점

컴포넌트 단우비 내부의 수많은 라인이 정리된 것 이상으로 체감되었던 것은 강력한 **캐싱 제어**였습니다. 
목록에 진입했다 상세페이지로 진입하고, 다시 뒤로 가기를 눌렀을 때 쿼리 식별자 기준으로 캐싱이 유효한 시간 내라면 저장된 값을 즉시 렌더링하여 사용자 입장에서 지연(Lag)이 발생하지 않는 부드러운 화면 전환이 가능해졌습니다.

또한, 데이터 갱신 기능(POST/PUT API)을 실행한 뒤 연동된 스토어 캐시들을 한 번의 `invalidateQueries` 호출로 일괄 폐기시켜 컴포넌트가 최신 상태를 알아서 새로고침(Fetch)하게 만드는 과정은 과거의 불완전한 수동 동기화를 잊게 만들었습니다.

---

## 💡 회고

새로운 도구의 적응을 넘어 깊게 와닿은 점은, 프론트엔드 환경에서 "상태(State)"라는 용어의 도메인 구분이었습니다.
- **Client State**: 모달의 표시 여부, 입력창 텍스트 등 애플리케이션 수명과 함께 파기되는 순수 UI 전용 상태
- **Server State**: 서버 DB라는 진실의 원천(Source of truth)에 본질을 두고 비동기적으로 클라이언트에 반영되는 일장적인 상태

과거 이 둘의 차이를 간과하고 무조건 `useState`나 전역 스토어(Redux 등) 내부 한 곳에 몰아넣으려던 설계 지향점을 탈피하게 된 결정적인 전환점이었습니다. 브라우저가 클라이언트 자원으로서 빌려 쓰는 외부 상태 관리는 전용 모델인 TanStack Query에 위임하고, 컴포넌트는 시각화 렌더링에만 집중하는 방식으로 사고의 깊이가 한층 성장할 수 있었습니다.
