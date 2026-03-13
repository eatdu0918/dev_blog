import { describe, it, expect } from 'vitest';
import * as R from 'ramda';

describe('Ramda.js Functional Patterns', () => {
  interface User {
    name: string;
    age: number;
    score: number;
  }

  const users: User[] = [
    { name: 'Alice', age: 25, score: 80 },
    { name: 'Bob', age: 18, score: 90 },
    { name: 'Charlie', age: 32, score: 70 },
    { name: 'David', age: 20, score: 85 },
  ];

  it('should demonstrate currying with R.prop', () => {
    const getName = R.prop('name'); // Curried function
    expect(getName(users[0])).toBe('Alice');
    expect(getName(users[1])).toBe('Bob');
  });

  it('should process user data using R.pipe (Point-free)', () => {
    // 1. 20세 이상만 필터링
    // 2. 이름만 추출
    // 3. 알파벳 순 정렬
    const getSortedAdultNames = R.pipe(
      R.filter((u: User) => u.age >= 20),
      R.map(R.prop('name')),
      R.sortBy(R.identity)
    );

    const result = getSortedAdultNames(users);
    expect(result).toEqual(['Alice', 'Charlie', 'David']);
  });

  it('should demonstrate immutability (원본 보호)', () => {
    const originalScores = users.map(u => u.score);
    
    // 점수를 10점씩 올리는 연산
    const boostScores = R.map(R.over(R.lensProp('score'), R.add(10)));
    const boostedUsers = boostScores(users);

    expect(boostedUsers[0].score).toBe(90);
    expect(users[0].score).toBe(80); // 원본은 변하지 않아야 함
  });

  it('should find the average score of adults using composition', () => {
    const isAdult = (u: User) => u.age >= 20;
    const getScore = (u: User) => u.score;

    const adultAverageScore = R.pipe(
      R.filter(isAdult),
      R.map(getScore),
      (scores: number[]) => R.sum(scores) / scores.length
    );

    expect(adultAverageScore(users)).toBe((80 + 70 + 85) / 3);
  });
});
