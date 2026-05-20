const express = require('express');
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages (POST)
app.post('/webhook', (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;
      if (event.message) handleMessage(senderId, event.message.text);
      if (event.postback) handlePostback(senderId, event.postback.payload);
    });
    res.sendStatus(200);
  }
});

function handleMessage(senderId, text) {
  const lower = text.toLowerCase();
  if (lower.includes('menu')) {
    sendMenu(senderId);
  } else if (lower.includes('order')) {
    sendText(senderId, "What would you like to order? Please type your item from the menu.");
  } else if (lower.includes('complaint') || lower.includes('гомдол')) {
    sendText(senderId, "Бид таны гомдлыг сонсож байна. Дэлгэрэнгүй мэдээллийг бичнэ үү.");
  } else {
    sendQuickReplies(senderId);
  }
}

function sendMenu(senderId) {
  sendText(senderId,
    "☕ Our Menu:\n\n" +
    "Hot Drinks:\n- Espresso - 3,500₮\n- Latte - 4,500₮\n- Cappuccino - 4,500₮\n\n" +
    "Cold Drinks:\n- Iced Latte - 5,000₮\n- Cold Brew - 5,500₮\n\n" +
    "Food:\n- Croissant - 3,000₮\n- Muffin - 2,500₮"
  );
}

function sendQuickReplies(senderId) {
  const data = {
    recipient: { id: senderId },
    message: {
      text: "Сайн байна уу! Би танд юугаар туслах вэ?",
      quick_replies: [
        { content_type: "text", title: "📋 Menu", payload: "MENU" },
        { content_type: "text", title: "🛒 Order", payload: "ORDER" },
        { content_type: "text", title: "📝 Гомдол", payload: "COMPLAINT" }
      ]
    }
  };
  callAPI(data);
}

function handlePostback(senderId, payload) {
  if (payload === 'MENU') sendMenu(senderId);
  if (payload === 'ORDER') sendText(senderId, "Please tell me what you'd like to order!");
  if (payload === 'COMPLAINT') sendText(senderId, "Таны гомдлыг бичнэ үү, бид удахгүй холбогдох болно.");
}

function sendText(senderId, text) {
  callAPI({ recipient: { id: senderId }, message: { text } });
}

async function callAPI(data) {
  await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

app.listen(3000, () => console.log('Bot running on port 3000'));