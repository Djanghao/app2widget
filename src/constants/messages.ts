export const ASSISTANT_MESSAGES = {
  // appId 模式
  FETCH_APP_METADATA: (appId: string) =>
    `I'll fetch the metadata for app ID: ${appId}`,

  START_MOCK_DATA_APPID:
    "Based on this metadata, I'll generate mock data for the widget.",

  // description 模式
  START_MOCK_DATA_DESCRIPTION:
    "Based on your description, I'll generate mock data for the widget.",

  // Widget 生成
  START_WIDGET: (styleName: string) =>
    `Based on the mock data and style (${styleName}), I'll generate the widget code.`,

  // 错误消息
  ERROR_INVALID_APP_ID:
    "The provided App ID doesn't exist in our database.",
  ERROR_EMPTY_API_KEY:
    "API key is required. Please configure your API key in the settings.",
  ERROR_LLM_FAILED:
    "Failed to communicate with the LLM API. Please check your API key and configuration.",
  ERROR_APP_METADATA_FETCH:
    "I encountered an error while fetching the app metadata. Please verify the app ID and try again.",
  ERROR_GENERIC:
    "An error occurred while processing your request. Please try again.",
}
