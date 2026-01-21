# LocalLens 🔍

**LocalLens** empowers small business owners to simulate pricing decisions before they go live. Using AI-driven customer personas, it visualizes how real customers might react—balancing revenue growth with loyalty, trust, and churn.


https://github.com/user-attachments/assets/cdf58605-0533-4136-945c-13e7565a2cf8


---

## 💡 Inspiration
Small businesses make pricing decisions that can make or break them, yet most have no way to test changes before going live. We were inspired by how high-risk industries (like quantitative trading firms) simulate outcomes before acting. We asked: *Why can’t local businesses do the same?*

## 🚀 What it does
LocalLens lets business owners simulate pricing changes in a "sandbox" environment. 
- **AI-Driven Personas:** AI agents represent specific customer segments with unique behaviors and constraints.
- **Visual Canvas:** Real-time feedback on customer reactions (loyalty, trust, churn).
- **Risk Dashboard:** Surfaces key metrics and uncertainty ranges, helping owners understand risk, not just revenue.

## 🛠️ How we built it
We built a lightweight simulation engine powered by AI agents.
- **Backend:** A Node.js/Express "Agentic Batching Engine" that integrates with the **Gemini API** to model complex customer behavior.
- **Frontend:** A TypeScript-based React application featuring a visual canvas for customer reactions and an intuitive management dashboard.
- **Decision Science:** We focused on turning abstract pricing risks into intuitive, visual insights that non-technical users can understand in minutes.

## 🏗️ Tech Stack
### **Frontend**
- **Language:** TypeScript
- **Framework:** React
- **Repository:** [nwhacks2026clientside](https://github.com/harjotsk03/nwhacks2026clientside)

### **Backend**
- **Language:** Node.js (CommonJS)
- **Framework:** Express
- **AI:** Google Generative AI (Gemini), OpenAI
- **Testing:** Jest / Supertest
- **Repository:** [nwhacks26-agent](https://github.com/markaxelus/nwhacks26-agent)

### **Key API Endpoints**
- `POST /api/simulate`: Run a standard simulation.
- `POST /api/simulate/advanced`: Trigger advanced agentic modeling.
- `GET /api/metadata`: Retrieve personas and simulation configurations.

---

## 🧠 Challenges we ran into
Balancing **realism with simplicity** was our biggest hurdle. We needed to provide insights that felt trustworthy without overwhelming the user. Clear communication of **uncertainty** was prioritized over "false precision" to build better decision-making trust.

## ✨ Accomplishments that we're proud of
We successfully turned complex decision science into an intuitive experience. The **Customer Reaction Canvas** is a powerful way to make abstract pricing risk feel tangible for business owners.

## 📖 What we learned
Businesses don’t just want "perfect" predictions—they want **clarity around risk**. Showing ranges, reasoning, and customer intent builds significantly more trust than exact numerical forecasts ever could.

## 🔮 What's next for LocalLens
- **POS Integration:** Seamlessly integrate with Shopify, Square, and Clover to use real transaction data.
- **Inventory Tracking:** Link pricing simulations to stock levels and supply chain constraints.
- **Deeper Personas:** Expand the AI agent library to include more niche local demographics.

---

*Built for nwHacks 2026.*
