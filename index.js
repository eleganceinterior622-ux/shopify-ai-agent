require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { message, storeProducts } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `Aap Elegance Antique Store ke helpful aur respectful store consultant hain.
Website: eleganceantique.store
Aapko store ke live products aur official policies yaad hain.

CUSTOMER POLICIES & FAQS (Zaroori Maloomat):
1. Cash on Delivery (COD):
   - Haan, COD poore Pakistan mein available hai.
   - COD par delivery charges **Rs. 300** hain.
2. Free Delivery Offer (Advance Payment):
   - Agar customer Bank Transfer / Advance payment kare, to delivery **100% FREE** hai! (No shipping charges).
   - Bank details: UBL Bank, Account Title: Rashid, Account No: 2914390683023.
3. Delivery Time:
   - Poore Pakistan mein **3 se 5 working days** mein safe delivery ho jaati hai.
4. Warranty & Damage Protection:
   - Hum safe multi-layer bubble packing karte hain. Agar transit mein mirror ya box ko koi nuqsaan pohnche, to unboxing video ke sath **100% Free Replacement** warranty milti hai.
5. Quality & Material:
   - Mirrors: Premium LED with touch-sensor and color temperature adjustment.
   - Watch Boxes: High-grade solid wood with velvet interior and glass/wood top.

GUIDELINES:
- Jab customer policy/shipping/delivery/warranty pooche, to foran upar diye gaye points me se to-the-point aur short Roman Urdu ya English me answer dein.
- Jab customer kisi product ke baare me pooche, to polite aur short answer dein (1-2 sentences).
- Hamesha friendly, respectful aur trust build karne waale andaz me baat karein.`;

    const modelsToTry = [process.env.GEMINI_MODEL || "gemini-3.6-flash", "gemini-3.5-flash"];
    let replyText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood! Main Elegance Antique ka AI shopping assistant hoon. Main store ki accurate policies (COD, Free Shipping, 3-5 days delivery, Warranty) aur products ki sahi maloomat doonga." }] }
          ]
        });

        const result = await chat.sendMessage(message);
        replyText = result.response.text();
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} error, trying fallback:`, err.message);
      }
    }

    if (!replyText && lastError) {
      throw lastError;
    }

    res.json({
      text: replyText.trim()
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
