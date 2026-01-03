import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string) {
  geminiClient = new GoogleGenerativeAI(apiKey);
}

/**
 * 列出可用的模型（用于调试）
 * 使用 REST API 直接调用
 */
export async function listAvailableModels(apiKey: string): Promise<Array<{name: string, displayName: string, supportedMethods: string[]}>> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    const modelList = models.map((model: any) => ({
      name: model.name || '',
      displayName: model.displayName || model.name || '',
      supportedMethods: model.supportedGenerationMethods || []
    }));
    
    console.log('Available models:', modelList);
    return modelList;
  } catch (error: any) {
    console.error('Error listing models:', error);
    throw new Error(`无法列出可用模型: ${error.message}`);
  }
}

/**
 * 使用Gemini进行文本对话
 */
export async function chatWithGemini(
  text: string,
  systemPrompt: string = 'You are an expert System Design interviewer and advisor. Help answer system design questions with detailed, structured responses.',
  apiKey: string,
  model: string = 'gemini-2.0-flash',
  temperature: number = 0.7
): Promise<string> {
  // 每次都重新初始化以确保使用最新的API密钥
  initializeGemini(apiKey);

  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Please set API key in settings.');
  }

  try {
    // 尝试不同的模型名称格式
    const modelVariants = [
      model,
      model.replace('gemini-', 'models/gemini-'),
      `models/${model}`,
    ];

    let lastError: any = null;
    
    for (const modelName of modelVariants) {
      try {
        // 调试：打印 systemInstruction
        console.log('Setting systemInstruction:', systemPrompt?.substring(0, 100) + '...');
        console.log('User text:', text?.substring(0, 100) + '...');
        
        const genModel = geminiClient.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 8192, // 增加最大输出 tokens，避免截断
          },
          systemInstruction: systemPrompt,
        });
        
        // 构建完整的用户消息：如果 systemInstruction 可能不生效，将 systemPrompt 也包含在消息中
        // 这样可以确保预设 prompt 被应用
        const fullUserMessage = systemPrompt && systemPrompt.trim() 
          ? `${systemPrompt}\n\n用户问题：${text}`
          : text;
        
        const result = await genModel.generateContent(fullUserMessage);
        const response = result.response;
        
        // 获取完整响应文本
        let answer = '';
        try {
          // 尝试获取完整文本
          answer = response.text();
          
          // 如果文本为空或很短，尝试从 candidates 获取
          if (!answer || answer.length < 10) {
            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
              const content = candidates[0].content;
              if (content && content.parts) {
                answer = content.parts.map((part: any) => part.text || '').join('');
              }
            }
          }
        } catch (textError) {
          // 如果 text() 失败，尝试从 candidates 获取
          console.warn('Failed to get text directly, trying candidates:', textError);
          const candidates = response.candidates;
          if (candidates && candidates.length > 0) {
            const content = candidates[0].content;
            if (content && content.parts) {
              answer = content.parts.map((part: any) => part.text || '').join('');
            }
          }
        }

        return answer || 'No response from Gemini';
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed with model name "${modelName}":`, err.message);
        // 继续尝试下一个
      }
    }
    
    // 如果所有尝试都失败，抛出最后一个错误
    throw lastError;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    const errorMessage = error.message || 'Failed to get response from Gemini';
    
    // 提供更友好的错误信息
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      throw new Error(`模型 "${model}" 不可用。请尝试使用 "gemini-pro" 或检查 API 密钥是否正确。错误详情: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * 使用Gemini Vision分析截图
 */
export async function analyzeScreenshot(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  visionModel: string = 'gemini-2.0-flash',
  temperature: number = 0.7,
  systemPrompt?: string
): Promise<string> {
  // 每次都重新初始化以确保使用最新的API密钥
  initializeGemini(apiKey);

  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Please set API key in settings.');
  }

  try {
    // 尝试不同的模型名称格式
    const modelVariants = [
      visionModel,
      visionModel.replace('gemini-', 'models/gemini-'),
      `models/${visionModel}`,
      'gemini-pro-vision', // 回退到已知可用的模型
      'models/gemini-pro-vision',
    ];

    let lastError: any = null;
    
    for (const modelName of modelVariants) {
      try {
        const genModel = geminiClient.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 8192, // 增加最大输出 tokens，避免截断
          },
          systemInstruction: systemPrompt || 'You are an expert System Design interviewer and advisor. Help analyze system design questions and provide detailed, structured answers.',
        });

        // 将base64图片转换为Part
        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/png',
          },
        };

        const textPart = {
          text: prompt,
        };

        const result = await genModel.generateContent([textPart, imagePart]);
        const response = await result.response;
        
        // 检查是否因为 token 限制而截断
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'MAX_TOKENS') {
          console.warn('Response was truncated due to MAX_TOKENS limit. Consider increasing maxOutputTokens.');
        }
        
        // 获取完整响应文本
        let answer = response.text();
        
        // 如果 text() 返回的内容可能不完整，尝试从 candidates 获取所有 parts
        if (answer && response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts) {
            const fullText = candidate.content.parts
              .map((part: any) => part.text || '')
              .join('');
            // 如果从 parts 获取的文本更长，使用它
            if (fullText.length > answer.length) {
              answer = fullText;
            }
          }
        }

        return answer || 'No response from Gemini';
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed with vision model name "${modelName}":`, err.message);
        // 继续尝试下一个
      }
    }
    
    // 如果所有尝试都失败，抛出最后一个错误
    throw lastError;
  } catch (error: any) {
    console.error('Gemini Vision API error:', error);
    const errorMessage = error.message || 'Failed to analyze screenshot with Gemini';
    
    // 提供更友好的错误信息
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      throw new Error(`Vision 模型 "${visionModel}" 不可用。请尝试使用 "gemini-pro-vision" 或检查 API 密钥是否正确。错误详情: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }
}

