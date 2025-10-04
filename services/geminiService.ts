
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
    // Try finding an object if array fails
    const objStartIndex = str.indexOf('{');
    const objEndIndex = str.lastIndexOf('}');
    if (objStartIndex !== -1 && objEndIndex !== -1) {
        return `[${str.substring(objStartIndex, objEndIndex + 1)}]`;
    }
    throw new Error('Could not find a valid JSON structure in the response.');
  }
  return str.substring(startIndex, endIndex + 1);
};

const generateSummariesForSources = async (sources: Source[], topic: string): Promise<Source[]> => {
    if (sources.length === 0) {
        return sources;
    }

    const prompt = `
        You are an expert at summarizing web content for research purposes.
        Given the main topic "${topic}", provide a concise, one-sentence summary for each of the following web pages.
        Use your search tool to access and understand the content of each page.
        Your entire response must be a single, valid JSON array of objects. Do not include any text, markdown, or explanations outside of the JSON structure.

        **CRITICAL INSTRUCTIONS:**
        1.  The summary MUST be a single, informative sentence.
        2.  Each object in the array must have two keys: "uri" (string) and "summary" (string).
        3.  The "uri" in your JSON output must EXACTLY match the URI provided in the list below.

        **Web Pages to Summarize:**
        ${sources.map(s => s.uri).join('\n')}

        **Example JSON Output:**
        [
            {
                "uri": "https://example.com/page1",
                "summary": "This is a one-sentence summary for page1."
            },
            {
                "uri": "https://example.com/page2",
                "summary": "This is a one-sentence summary for page2."
            }
        ]

        Now, generate the response.
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
        const summaries: { uri: string; summary: string }[] = JSON.parse(jsonString);

        const summaryMap = new Map(summaries.map(s => [s.uri, s.summary]));

        return sources.map(source => ({
            ...source,
            summary: summaryMap.get(source.uri),
        }));

    } catch (error) {
        console.warn("Could not generate summaries for sources:", error);
        // If summarization fails, return the original sources without summaries.
        // This makes the feature a progressive enhancement.
        return sources;
    }
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

    const sourcesWithSummaries = await generateSummariesForSources(sources, topic);

    return { qaList, sources: sourcesWithSummaries };
  } catch (error) {
    console.error("Error generating Q&A:", error);
    throw new Error(
      "Failed to generate Q&A. The model may have returned an invalid format. Please try refining your topic."
    );
  }
};
