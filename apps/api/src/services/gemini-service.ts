import { GoogleGenAI } from "@google/genai";

export async function getGeminiResponse() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    temperature: 0.1,
    thinkingConfig: {
      thinkingBudget: 0,
    },
  };
  const model = "gemini-2.5-flash-lite";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  // const response = await ai.models.generateContentStream({
  //   model,
  //   config,
  //   contents,
  // });
  // let fileIndex = 0;
  // for await (const chunk of response) {
  //   console.log(chunk.text);
  // }
}
