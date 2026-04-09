exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { thought, mode } = JSON.parse(event.body);
    const brutalInstruction = mode === 'brutal' ? 'Use a harsh, blunt tone.' : 'Be direct and logical.';

    const systemPrompt = `You are an Overthinking Killer. Respond ONLY in raw JSON. ${brutalInstruction}
    Format: {"situation": "", "control": {"yours": [], "notYours": []}, "worstCase": "", "realityCheck": [], "actions": [], "brutalTruth": ""}`;

    // Gemini API Call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser thought: ${thought}` }]
        }]
      })
    });

    const data = await response.json();
    
    // Gemini returns text inside candidates[0].content.parts[0].text
    const aiText = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: aiText }) 
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
