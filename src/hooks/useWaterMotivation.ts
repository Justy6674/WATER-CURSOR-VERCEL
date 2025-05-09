
export const useWaterMotivation = () => {
  const getMotivationalMessage = () => {
    const messages = [
      "💧 Start your day hydrated! People who drink water first thing in the morning have better energy levels.",
      "💧 Today's a new day to hit your hydration goals! Your body will thank you.",
      "💧 Did you know? Being properly hydrated can improve brain function by up to 14%!",
      "💧 Let's make today a great hydration day! Your cells need that water!",
      "💧 Morning tip: Try drinking a full glass of water before your morning coffee or tea.",
      "💧 Challenge for today: Try to finish 50% of your water goal before lunch!",
      "💧 Water fact: Proper hydration can reduce headaches by up to 40%.",
      "💧 Remember: Thirst is often a sign you're already dehydrated. Stay ahead!",
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return { getMotivationalMessage };
};
