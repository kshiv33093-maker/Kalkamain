
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });

    if (url.pathname === "/api/edit") {
      if (request.method !== "POST") {
        return json({ error: "POST method required." }, 405);
      }

      try {
        if (!env.OPENAI_API_KEY) {
          return json({
            error: "OpenAI API key is not configured."
          }, 500);
        }

        const length = Number(
          request.headers.get("content-length") || 0
        );

        if (length > 10 * 1024 * 1024) {
          return json({
            error: "Photo is too large. Upload a smaller photo."
          }, 413);
        }

        const body = await request.json();
        const image = body.image;
        const prompt = body.prompt;

        if (
          typeof image !== "string" ||
          !/^data:image\/(jpeg|png|webp);base64,/.test(image)
        ) {
          return json({
            error: "Please upload a valid JPG, PNG or WebP photo."
          }, 400);
        }

        if (image.length > 9 * 1024 * 1024) {
          return json({
            error: "Photo is too large. Please choose a smaller photo."
          }, 413);
        }

        if (
          typeof prompt !== "string" ||
          prompt.trim().length < 3 ||
          prompt.length > 5000
        ) {
          return json({
            error: "Please select a photo style or enter a prompt."
          }, 400);
        }

        const apiResponse = await fetch(
          "https://api.openai.com/v1/images/edits",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-image-2.5-sunburst",
              images: [
                { image_url: image }
              ],
              prompt: prompt,
              quality: "high",
              size: "1024x1024",
              output_format: "png",
              n: 1
            })
          }
        );

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
          return json({
            error:
              result.error?.message ||
              "AI image service failed. Please try again."
          }, apiResponse.status);
        }

        const generatedImage = result.data?.[0]?.b64_json;

        if (!generatedImage) {
          return json({
            error: "AI did not return an image."
          }, 502);
        }

        return json({
          image: generatedImage
        });

      } catch (error) {
        return json({
          error: error.message || "Something went wrong."
        }, 500);
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("KalKaMain AI is ready", {
      status: 200
    });
  }
};
