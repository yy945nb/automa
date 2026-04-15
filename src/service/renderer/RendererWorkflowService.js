import { MessageListener } from '@/utils/message';

// toRaw removed — no longer using Vue reactivity proxies
function toPlainObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class RendererWorkflowService {
  static executeWorkflow(workflowData, options) {
    /**
     * Convert Vue-created proxy into plain object.
     * It will throw error if there a proxy inside the object.
     */
    const clonedWorkflowData = {};
    Object.keys(workflowData).forEach((key) => {
      clonedWorkflowData[key] = toPlainObject(workflowData[key]);
    });

    return MessageListener.sendMessage(
      'workflow:execute',
      { ...workflowData, options },
      'background'
    );
  }

  static stopWorkflowExecution(executionId) {
    return MessageListener.sendMessage(
      'workflow:stop',
      executionId,
      'background'
    );
  }
}

export default RendererWorkflowService;
