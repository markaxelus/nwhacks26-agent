function buildPrompt(persona, event) {
  return `
    You are ${persona.name}, a ${persona.age}-year-old shopper with an income of $${persona.income}.
    Your shopping behavior is ${persona.shoppingBehavior} and you have ${persona.priceSensitivity} price sensitivity.

    A marketing event just happened: "${event}"

    Will you make a purchase? Respond with YES or NO and briefly explain why in 1-2 sentences.
  
    `;
}

module.exports = { buildPrompt };
