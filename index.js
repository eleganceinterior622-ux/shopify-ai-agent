require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "addToCart",
        description: "Customer ke cart mein product add karta hai jab wo khareedne ko kahe.",
        parameters: {
          type: "OBJECT",
          properties: {
            variantId: { type: "STRING", description: "Shopify product variant ID" },
            productName: { type: "STRING", description: "Product ka naam" }
          },
          required: ["variantId", "productName"]
        }
      },
      {
        name: "goToCheckout",
        description: "Jab customer bole checkout ya order final karna hai.",
        parameters: { type: "OBJECT", properties: {} }
      }
    ]
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, storeProducts } = req.body;

    // gemini-3.6-flash model use ho raha hai (gemini-1.5-flash current API version par deprecated hai)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      tools: tools
    });

    const systemPrompt = `Aap Elegance Antique Store ke helpful shopping assistant hain.
Customer se Roman Urdu ya English me baat karein.
Store ke live products: ${JSON.stringify(storeProducts || [])}

Rules:
1. Jab customer koi product lene ko kahe, to foran 'addToCart' tool call karein us product ki variantId ke sath.
2. Jab customer bole checkout ya buy now, to 'goToCheckout' tool call karein.`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! Main Elegance Antique ka sales assistant hoon." }] }
      ]
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const functionCalls = response.functionCalls();

    let replyText = "";
    try {
      replyText = response.text() || "";
    } catch {
      replyText = "";
    }

    res.json({
      text: replyText,
      functionCalls: functionCalls || []
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
