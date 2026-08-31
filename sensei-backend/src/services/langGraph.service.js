import { Annotation, StateGraph, START, END } from '@langchain/langgraph';

const agents = {};

export const registerAgent = (name, graph) => {
  agents[name] = graph;
};

export const runAgent = async (agentName, inputState, socketCallback = null) => {
  const agent = agents[agentName];
  if (!agent) {
    throw new Error(`Agent '${agentName}' not found. Available: ${Object.keys(agents).join(', ')}`);
  }

  const compiled = agent.compile();
  
  const timeoutMs = 10000;
  
  if (socketCallback) {

    const stream = await compiled.stream(inputState, { streamMode: "updates" });
    let finalState = {};
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Agent execution timeout after 10s')), timeoutMs)
    );

    const processStream = async () => {
      for await (const chunk of stream) {
        socketCallback(chunk);
        finalState = { ...finalState, ...chunk };
      }
      return finalState;
    };

    return await Promise.race([processStream(), timeoutPromise]);
  } else {

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Agent execution timeout after 10s')), timeoutMs)
    );
    
    return await Promise.race([compiled.invoke(inputState), timeoutPromise]);
  }
};

export const getRegisteredAgents = () => Object.keys(agents);

export { Annotation, StateGraph, START, END };
export default { registerAgent, runAgent, getRegisteredAgents };
