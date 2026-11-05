export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("KalKaMain AI is ready");
    }

    try {
      const { image, prompt } = await request.json();

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: prompt || "Create a beautiful, realistic future-self portrait",
            size: "1024x1024"
          })
        }
      );

      const result = await response.json();

      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
  }
};
