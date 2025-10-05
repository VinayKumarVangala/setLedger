import apiClient from './apiClient';

class AIAssistantService {
  async sendMessage(orgId, memberId, message) {
    try {
      const response = await apiClient.post(`/ai-assistant/chat/${orgId}/${memberId}`, {
        message,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      throw error;
    }
  }

  async getContext(orgId, memberId) {
    try {
      const response = await apiClient.get(`/ai-assistant/context/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI context:', error);
      throw error;
    }
  }

  async trainWithData(orgId, memberId, trainingData) {
    try {
      const response = await apiClient.post(`/ai-assistant/train/${orgId}/${memberId}`, trainingData);
      return response.data;
    } catch (error) {
      console.error('Error training AI assistant:', error);
      throw error;
    }
  }
}

export default new AIAssistantService();