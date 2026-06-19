export function calculateAnswerCompatibility(userAnswers: number[], profileAnswers: number[]): number {
  if (!userAnswers.length || !profileAnswers.length) {
    return 80;
  }

  const comparableAnswers = userAnswers.slice(0, profileAnswers.length);
  const maxDifference = comparableAnswers.length * 4;
  const totalDifference = comparableAnswers.reduce(
    (sum, value, index) => sum + Math.abs(value - profileAnswers[index]),
    0
  );

  return Math.max(0, 100 - (totalDifference / maxDifference) * 100);
}

export function calculateInterestCompatibility(userInterests: string[], profileInterests: string[]): number {
  if (!userInterests.length) {
    return 70;
  }

  const normalizedProfileInterests = profileInterests.map((interest) => interest.toLowerCase());
  const shared = userInterests.filter((interest) =>
    normalizedProfileInterests.includes(interest.toLowerCase())
  ).length;

  return Math.min(100, 60 + shared * 12);
}
