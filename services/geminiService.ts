
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Difficulty, QAItem, Source } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string): string => {
  const startIndex = str.indexOf('[');
  const endIndex = str.lastIndexOf(']');
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find a valid JSON array in the response.');
  }
  return str.substring(startIndex, endIndex + 1);
};

export const generateQA = async (
  topic: string,
  difficulty: Difficulty,
  numQuestions: number
): Promise<{ qaList: QAItem[]; sources: Source[] }> => {
  const prompt = `
    You are an expert Question and Answer generation system. Your task is to generate a set of unique, factually accurate questions and answers based on a given topic, difficulty, and number of questions.

    **CRITICAL INSTRUCTIONS:**
    1.  **Factual Accuracy is Paramount:** Use the provided search tool to find and verify all information. Do not include any information that is not verifiable. All answers must be 100% correct and reliable.
    2.  **Uniqueness:** Ensure that no two questions in the generated set are duplicates or too similar.
    3.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON array of objects. Do not include any text, markdown, or explanations outside of the JSON structure.
    4.  **JSON Structure:** Each object in the array must have two keys: "question" (a string) and "answer" (a string).

    **Request:**
    -   Topic: ${topic}
    -   Difficulty: ${difficulty}
    -   Number of Questions: ${numQuestions}

    **Example JSON Output Format:**
    [
        {
            "question": "This is the first question on the topic.",
            "answer": "This is the factually correct answer to the first question."
        },
        {
            "question": "This is the second question on the topic.",
            "answer": "This is the factually correct answer to the second question."
        }
    ]

    Now, generate the response for the provided request.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text;
    const jsonString = cleanJsonString(rawText);
    const qaList: QAItem[] = JSON.parse(jsonString);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = groundingChunks
      .map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title,
      }))
      .filter((source: Source) => source.uri && source.title)
      .reduce((acc: Source[], current: Source) => { // Deduplicate sources
        if (!acc.some(item => item.uri === current.uri)) {
          acc.push(current);
        }
        return acc;
      }, []);
      

    if (!Array.isArray(qaList) || qaList.length === 0) {
      throw new Error("Generated content is not a valid Q&A list.");
    }

    return { qaList, sources };
  } catch (error) {
    console.error("Error generating Q&A:", error);
    throw new Error(
      "Failed to generate Q&A. The model may have returned an invalid format. Please try refining your topic."
    );
  }
};
