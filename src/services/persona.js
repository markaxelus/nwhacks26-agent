
const personas = [
  // Budget-Conscious Shoppers (1-10)
  { id: 1, name: "Budget Beth", age: 28, income: 35000, shoppingBehavior: "price-driven", priceSensitivity: "very-high", preferredEvents: ["sales", "clearance"] },
  { id: 2, name: "Frugal Frank", age: 42, income: 45000, shoppingBehavior: "needs-based", priceSensitivity: "very-high", preferredEvents: ["discount", "coupon"] },
  { id: 3, name: "Deal Hunter Dana", age: 31, income: 38000, shoppingBehavior: "opportunistic", priceSensitivity: "high", preferredEvents: ["flash-sale", "daily-deal"] },
  { id: 4, name: "Coupon Carl", age: 55, income: 42000, shoppingBehavior: "strategic", priceSensitivity: "very-high", preferredEvents: ["bogo", "percentage-off"] },
  { id: 5, name: "Thrifty Tina", age: 24, income: 32000, shoppingBehavior: "minimalist", priceSensitivity: "high", preferredEvents: ["seasonal-sale", "student-discount"] },
  { id: 6, name: "Penny-Pincher Pete", age: 38, income: 40000, shoppingBehavior: "comparison-shopper", priceSensitivity: "very-high", preferredEvents: ["price-match", "lowest-price"] },
  { id: 7, name: "Economical Ella", age: 29, income: 36000, shoppingBehavior: "value-seeker", priceSensitivity: "high", preferredEvents: ["bundle-deal", "multi-buy"] },
  { id: 8, name: "Saver Sam", age: 47, income: 44000, shoppingBehavior: "cautious", priceSensitivity: "very-high", preferredEvents: ["end-of-season", "warehouse-sale"] },
  { id: 9, name: "Budget-Smart Brenda", age: 33, income: 39000, shoppingBehavior: "planned", priceSensitivity: "high", preferredEvents: ["holiday-sale", "anniversary-sale"] },
  { id: 10, name: "Discount Dave", age: 51, income: 43000, shoppingBehavior: "patient", priceSensitivity: "very-high", preferredEvents: ["markdown", "final-sale"] },

  // Middle-Income Moderates (11-25)
  { id: 11, name: "Moderate Mike", age: 35, income: 65000, shoppingBehavior: "balanced", priceSensitivity: "medium", preferredEvents: ["quality-sale", "brand-discount"] },
  { id: 12, name: "Practical Paula", age: 40, income: 68000, shoppingBehavior: "quality-focused", priceSensitivity: "medium", preferredEvents: ["premium-sale", "loyalty-bonus"] },
  { id: 13, name: "Sensible Sarah", age: 36, income: 62000, shoppingBehavior: "research-driven", priceSensitivity: "medium", preferredEvents: ["review-verified", "trusted-brand"] },
  { id: 14, name: "Reasonable Rob", age: 44, income: 70000, shoppingBehavior: "needs-wants-balance", priceSensitivity: "medium", preferredEvents: ["member-exclusive", "early-access"] },
  { id: 15, name: "Middleground Mary", age: 32, income: 60000, shoppingBehavior: "occasional-splurge", priceSensitivity: "medium-low", preferredEvents: ["new-arrival", "limited-edition"] },
  { id: 16, name: "Average Andy", age: 38, income: 66000, shoppingBehavior: "conventional", priceSensitivity: "medium", preferredEvents: ["standard-sale", "weekend-deal"] },
  { id: 17, name: "Balanced Bill", age: 41, income: 67000, shoppingBehavior: "mix-matcher", priceSensitivity: "medium", preferredEvents: ["category-sale", "department-deal"] },
  { id: 18, name: "Stable Steve", age: 45, income: 71000, shoppingBehavior: "routine", priceSensitivity: "medium", preferredEvents: ["subscription-discount", "autoship-save"] },
  { id: 19, name: "Neutral Nancy", age: 34, income: 63000, shoppingBehavior: "flexible", priceSensitivity: "medium", preferredEvents: ["pop-up-sale", "surprise-offer"] },
  { id: 20, name: "Fair-Price Fiona", age: 39, income: 69000, shoppingBehavior: "value-conscious", priceSensitivity: "medium", preferredEvents: ["fair-trade", "ethical-brand"] },
  { id: 21, name: "Consistent Chris", age: 43, income: 64000, shoppingBehavior: "brand-loyal", priceSensitivity: "low-medium", preferredEvents: ["favorite-brand", "repeat-purchase"] },
  { id: 22, name: "Steady Stella", age: 37, income: 65000, shoppingBehavior: "predictable", priceSensitivity: "medium", preferredEvents: ["monthly-special", "regular-promo"] },
  { id: 23, name: "Calculated Cathy", age: 42, income: 68000, shoppingBehavior: "analytical", priceSensitivity: "medium", preferredEvents: ["data-backed", "proven-quality"] },
  { id: 24, name: "Measured Matt", age: 46, income: 72000, shoppingBehavior: "deliberate", priceSensitivity: "medium", preferredEvents: ["well-reviewed", "recommended"] },
  { id: 25, name: "Even-Keeled Ed", age: 40, income: 66000, shoppingBehavior: "stable", priceSensitivity: "medium", preferredEvents: ["consistent-pricing", "no-gimmicks"] },

  // Affluent Aspirational (26-35)
  { id: 26, name: "Trendy Trent", age: 30, income: 95000, shoppingBehavior: "trend-follower", priceSensitivity: "low", preferredEvents: ["trending", "influencer-pick"] },
  { id: 27, name: "Status-Seeking Susan", age: 34, income: 98000, shoppingBehavior: "brand-conscious", priceSensitivity: "low", preferredEvents: ["designer-sale", "luxury-brand"] },
  { id: 28, name: "Image-Aware Ian", age: 37, income: 92000, shoppingBehavior: "appearance-driven", priceSensitivity: "low", preferredEvents: ["exclusive-drop", "VIP-access"] },
  { id: 29, name: "Aspirational Amy", age: 29, income: 88000, shoppingBehavior: "lifestyle-upgrade", priceSensitivity: "low-medium", preferredEvents: ["premium-quality", "status-symbol"] },
  { id: 30, name: "Upscale Ulysses", age: 41, income: 102000, shoppingBehavior: "quality-over-price", priceSensitivity: "low", preferredEvents: ["artisan", "handcrafted"] },
  { id: 31, name: "Premium Patty", age: 33, income: 96000, shoppingBehavior: "best-of-best", priceSensitivity: "very-low", preferredEvents: ["top-rated", "award-winning"] },
  { id: 32, name: "Sophisticated Sophie", age: 39, income: 105000, shoppingBehavior: "refined-taste", priceSensitivity: "low", preferredEvents: ["curated-selection", "boutique"] },
  { id: 33, name: "Discerning Derek", age: 44, income: 110000, shoppingBehavior: "selective", priceSensitivity: "very-low", preferredEvents: ["limited-run", "numbered-edition"] },
  { id: 34, name: "Elite Emma", age: 36, income: 115000, shoppingBehavior: "exclusive-seeker", priceSensitivity: "very-low", preferredEvents: ["members-only", "invitation-only"] },
  { id: 35, name: "Refined Rachel", age: 42, income: 108000, shoppingBehavior: "connoisseur", priceSensitivity: "low", preferredEvents: ["collector-item", "rare-find"] },

  // Luxury & High-Net-Worth (36-42)
  { id: 36, name: "Wealthy Walter", age: 52, income: 250000, shoppingBehavior: "convenience-first", priceSensitivity: "very-low", preferredEvents: ["concierge-service", "white-glove"] },
  { id: 37, name: "Luxury Linda", age: 48, income: 275000, shoppingBehavior: "premium-only", priceSensitivity: "none", preferredEvents: ["bespoke", "custom-made"] },
  { id: 38, name: "High-End Henry", age: 55, income: 320000, shoppingBehavior: "time-is-money", priceSensitivity: "very-low", preferredEvents: ["same-day", "expedited"] },
  { id: 39, name: "Affluent Alice", age: 50, income: 290000, shoppingBehavior: "luxury-lifestyle", priceSensitivity: "none", preferredEvents: ["haute-couture", "flagship-store"] },
  { id: 40, name: "Rich Richard", age: 58, income: 350000, shoppingBehavior: "indulgent", priceSensitivity: "none", preferredEvents: ["first-class", "platinum-tier"] },
  { id: 41, name: "Opulent Olivia", age: 46, income: 280000, shoppingBehavior: "extravagant", priceSensitivity: "very-low", preferredEvents: ["limited-availability", "ultra-premium"] },
  { id: 42, name: "Privileged Preston", age: 54, income: 310000, shoppingBehavior: "effortless", priceSensitivity: "none", preferredEvents: ["personal-shopper", "delivery-premium"] },

  // Special Interest Segments (43-50)
  { id: 43, name: "Eco-Conscious Evan", age: 27, income: 55000, shoppingBehavior: "sustainability-focused", priceSensitivity: "medium", preferredEvents: ["eco-friendly", "carbon-neutral"] },
  { id: 44, name: "Ethical Ethan", age: 31, income: 58000, shoppingBehavior: "values-driven", priceSensitivity: "medium-low", preferredEvents: ["fair-trade", "social-impact"] },
  { id: 45, name: "Tech-Savvy Taylor", age: 26, income: 75000, shoppingBehavior: "digital-native", priceSensitivity: "medium", preferredEvents: ["app-exclusive", "online-only"] },
  { id: 46, name: "Impulse Buyer Iris", age: 23, income: 48000, shoppingBehavior: "spontaneous", priceSensitivity: "low-medium", preferredEvents: ["flash-sale", "limited-time"] },
  { id: 47, name: "Loyal Larry", age: 60, income: 52000, shoppingBehavior: "brand-devoted", priceSensitivity: "low", preferredEvents: ["loyalty-rewards", "points-multiplier"] },
  { id: 48, name: "Skeptical Shannon", age: 49, income: 61000, shoppingBehavior: "cautious-researcher", priceSensitivity: "high", preferredEvents: ["money-back-guarantee", "trial-period"] },
  { id: 49, name: "Social-Influenced Sienna", age: 22, income: 41000, shoppingBehavior: "peer-driven", priceSensitivity: "medium", preferredEvents: ["viral-product", "social-proof"] },
  { id: 50, name: "Analytical Arthur", age: 56, income: 78000, shoppingBehavior: "data-obsessed", priceSensitivity: "medium", preferredEvents: ["comparison-chart", "specs-detailed"] }
];


function getAllPersonas() {
  return personas;
}


function getPersonaById(id) {
  return personas.find(p => p.id === id) || null;
}

function getPersonasBySensitivity(sensitivity) {
  return personas.filter(p => p.priceSensitivity === sensitivity);
}

module.exports = {
  getAllPersonas,
  getPersonaById,
  getPersonasBySensitivity
};
