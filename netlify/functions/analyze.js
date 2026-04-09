exports.handler = async (event) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Parse the user input from the website
    const { thought, mode } = JSON.parse(event.body);

    // 3. Set the logic for the "Brutal" vs "Standard" toggle
    const brutalInstruction = mode === 'brutal' 
      ? 'Use an extremely harsh, blunt, and direct tone. No sugar-coating.' 
      : 'Be firm, logical, and direct.';

    const systemPrompt = `You are an Overthinking Killer. Transform messy thoughts into JSON.
    ${brutalInstruction}
    
    CRITICAL: Respond ONLY with a raw JSON object. No markdown, no backticks.
    Format: {"situation":"","control":{"yours":[],"notYours":[]},"worstCase":"","realityCheck":[],"actions":[],"brutalTruth":""}`;

    // 4. Call the Gemini API using the Environment Variable
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nThought: ${thought}` }] }],
        // 5. RELAX SAFETY SETTINGS: This prevents Gemini from blocking "anxiety" thoughts
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    // 6. Handle cases where Gemini fails or blocks the response
    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini API Error:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ text: "Error: Gemini blocked this request or API key is invalid." })
      };
    }

    // 7. Extract the text and send it back to the frontend
    const aiText = data.candidates[0].content.parts[0].text;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: aiText })
    };

  } catch (error) {
    console.error("Backend Crash:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ text: "Internal Server Error: " + error.message }) 
    };
  }
};
