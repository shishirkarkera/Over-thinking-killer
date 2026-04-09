exports.handler = async (event) => {
  // Only allow POST requests for security
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { thought, mode } = JSON.parse(event.body);

    // Set the AI logic based on the user's selection
    const brutalInstruction = mode === 'brutal'
      ? 'Use extremely direct, harsh tone. Call out self-deception bluntly. No softening.'
      : 'Be direct and logical. Firm but not unkind.';

    const systemPrompt = `You are an Overthinking Killer. Transform messy thoughts into structured clarity.
    
    ${brutalInstruction}
    
    CRITICAL: You must respond ONLY with a raw JSON object. 
    Do NOT include backticks, markdown formatting, or any introductory text.
    
    Expected JSON Structure:
    {
      "situation": "Short summary",
      "control": {
        "yours": ["item 1", "item 2"],
        "notYours": ["item 1", "item 2"]
      },
      "worstCase": "Realistic worst case scenario",
      "realityCheck": [
        { "tag": "assumption", "text": "insight" },
        { "tag": "bias", "text": "insight" }
      ],
      "actions": [
        { "step": "Concrete action", "why": "reasoning" }
      ],
      "brutalTruth": "Direct honest statement (required if mode is brutal)",
      "patterns": ["relationship", "career", "fear", "assumption", "other"]
    }`;

    // Talk to Anthropic securely using the Environment Variable
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY, // Hidden in Netlify Settings
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: thought }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.error?.message || "AI API Error" })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Function Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Internal Server Error: " + error.message }) 
    };
  }
};
