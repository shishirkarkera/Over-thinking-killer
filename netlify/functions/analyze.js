// No need for 'require(node-fetch)' as modern Netlify has it built-in.

exports.handler = async (event) => {
  // Only allow POST requests (security best practice)
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    // 1. Parse the incoming data from your website
    const { thought, mode } = JSON.parse(event.body);

    // 2. Set the "Personality" of the AI based on the mode selected
    const brutalInstruction = mode === 'brutal'
      ? 'Use extremely direct, harsh tone. Call out self-deception bluntly. No softening.'
      : 'Be direct and logical. Firm but not unkind.';

    const systemPrompt = `You are an Overthinking Killer — a thinking correction tool. Transform messy anxious thoughts into structured clarity and action. NOT a comfort tool.
    
    ${brutalInstruction}
    
    Respond ONLY in valid JSON format (no markdown, no backticks).
    
    {
      "situation": "1-2 sentence condensed summary",
      "control": {
        "yours": ["what you control 1", "what you control 2"],
        "notYours": ["what you don't control 1", "what you don't control 2"]
      },
      "worstCase": "Realistic worst case in 1-2 sentences.",
      "realityCheck": [
        { "tag": "assumption", "text": "specific insight" },
        { "tag": "bias", "text": "specific insight" }
      ],
      "actions": [
        { "step": "Concrete action", "why": "brief reason" }
      ],
      "brutalTruth": "harsh honest statement (only if brutal mode)",
      "patterns": ["relationship"]
    }`;

    // 3. Securely talk to Anthropic using the key hidden in Netlify variables
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY, // Pulls from Netlify Environment Variables
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: thought }]
      })
    });

    // 4. Handle API errors (like if the key is wrong or expired)
    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorData.error?.message || "Anthropic API Error" })
      };
    }

    const data = await response.json();

    // 5. Send the AI result back to your website
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Helps prevent CORS issues
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    // 6. Generic error catcher (logs to Netlify Function Logs)
    console.error("Function Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Internal Server Error: " + error.message }) 
    };
  }
};