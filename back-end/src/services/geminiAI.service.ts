const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 20000;

type GeminiPart = {
  text?: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

const readGeminiError = async (response: Response) => {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return "Gemini returned an empty error response.";
  }

  try {
    const payload = JSON.parse(rawText) as GeminiGenerateContentResponse;
    return payload.error?.message || rawText;
  } catch {
    return rawText;
  }
};

const getGeminiConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return { apiKey, model };
};

const extractText = (payload: GeminiGenerateContentResponse) => {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
};

export const geminiAIService = {
  async generateAdminInsight(prompt: string): Promise<{
    text: string;
    model: string;
  }> {
    const { apiKey, model } = getGeminiConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              topP: 0.9,
              maxOutputTokens: 900,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorMessage = await readGeminiError(response);
        throw new Error(errorMessage || "Gemini insight generation failed.");
      }

      const payload =
        (await response.json()) as GeminiGenerateContentResponse;

      return {
        text: extractText(payload),
        model,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Gemini request timed out. Check internet access or try again.",
        );
      }

      if (error instanceof Error) {
        throw new Error(`Gemini request failed: ${error.message}`);
      }

      throw new Error("Gemini request failed.");
    } finally {
      clearTimeout(timeout);
    }
  },
};
