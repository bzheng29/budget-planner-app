export class GeminiService {
  private apiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-2.5-pro';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string, jsonMode: boolean = false): Promise<string> {
    const url = `${this.apiEndpoint}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // Add JSON response format if requested
    if (jsonMode) {
      requestBody.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
}