
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFallbackMessage = (name: string, milestone: string): string => {
  if (milestone.includes('25%')) {
    return `${name}, you're 25% of the way to your hydration goal! Keep it up!`;
  } else if (milestone.includes('50%')) {
    return `${name}, halfway there! You've reached 50% of your daily water goal.`;
  } else if (milestone.includes('75%')) {
    return `${name}, you're 75% done! Almost at your daily hydration goal!`;
  } else if (milestone.includes('100%') || milestone.includes('goal completion')) {
    return `Great job ${name}! You've completed your daily hydration goal!`;
  } else {
    return `${name}, remember to stay hydrated throughout your day!`;
  }
};
