import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Zod schemas for validation
export const EmailClassificationSchema = z.object({
  intent: z.enum(['question', 'bug', 'billing', 'feature', 'complex']),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  topic: z.string(),
  summary: z.string(),
});

export type EmailClassification = z.infer<typeof EmailClassificationSchema>;

// State definition using LangGraph Annotation
export const EmailAgentState = Annotation.Root({
  // Input fields
  emailContent: Annotation<string>,
  senderEmail: Annotation<string>,
  emailId: Annotation<string>,

  // Processing fields
  classification: Annotation<EmailClassification | undefined>,
  searchResults: Annotation<string[] | undefined>,
  customerHistory: Annotation<Record<string, unknown> | undefined>,

  // Output fields
  responseText: Annotation<string | undefined>,
  status: Annotation<string | undefined>,
});

export type EmailAgentStateType = typeof EmailAgentState.State;

// Create LLM instance configured for OpenRouter
export function createLLM() {
  return new ChatOpenAI({
    // modelName: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5',
    // openAIApiKey: process.env.OPEN_ROUTER_API_KEY,
    // configuration: {
    //   baseURL: 'https://openrouter.ai/api/v1',
    // },
    model: "gpt-5-2025-08-07",
    // apiKey: process.env.OPENAI_API_KEY,
    temperature: 1.0,
  });
}

// Node: Read and validate email
async function readEmail(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[readEmail] Processing email ${state.emailId} from ${state.senderEmail}`);

  // In a real system, this might fetch additional context or validate the email
  return {
    status: 'email_read',
  };
}

// Node: Classify email intent using LLM
async function classifyIntent(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[classifyIntent] Classifying email intent...`);

  const llm = createLLM();

  const classificationPrompt = `
Analyze this customer email and classify it. Return a JSON object with:
- intent: one of "question", "bug", "billing", "feature", "complex"
- urgency: one of "low", "medium", "high", "critical"
- topic: brief topic description
- summary: one sentence summary

Email Content:
${state.emailContent}

From: ${state.senderEmail}

Return ONLY valid JSON, no markdown or explanation.
`;

  const response = await llm.invoke(classificationPrompt);
  const content = typeof response.content === 'string' ? response.content : '';

  try {
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const classification = EmailClassificationSchema.parse(parsed);

    console.log(`[classifyIntent] Classification: ${classification.intent} (${classification.urgency})`);

    return {
      classification,
      status: 'classified',
    };
  } catch {
    // Default classification on parse error
    console.warn('[classifyIntent] Failed to parse classification, using default');
    return {
      classification: {
        intent: 'complex',
        urgency: 'medium',
        topic: 'Unknown',
        summary: 'Could not classify email',
      },
      status: 'classification_failed',
    };
  }
}

// Router function to determine next node based on classification
function routeAfterClassification(state: EmailAgentStateType): string {
  const { classification } = state;

  if (!classification) {
    return 'draftResponse';
  }

  // Route based on intent and urgency
  if (classification.intent === 'billing' || classification.urgency === 'critical') {
    return 'humanReview';
  } else if (classification.intent === 'question') {
    return 'searchDocumentation';
  } else if (classification.intent === 'bug') {
    return 'bugTracking';
  } else {
    return 'draftResponse';
  }
}

// Node: Search documentation (stub)
async function searchDocumentation(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[searchDocumentation] Searching docs for: ${state.classification?.topic}`);

  // Stub: In a real system, this would search a vector DB or documentation
  const mockResults = [
    `Documentation found for "${state.classification?.topic}"`,
    'See our FAQ section for common questions',
    'Contact support if you need further assistance',
  ];

  return {
    searchResults: mockResults,
    status: 'docs_searched',
  };
}

// Node: Bug tracking integration (stub)
async function bugTracking(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[bugTracking] Creating bug ticket for: ${state.classification?.summary}`);

  // Stub: In a real system, this would create a ticket in Jira/GitHub/etc
  return {
    searchResults: [`Bug ticket created: BUG-${Date.now()}`],
    status: 'bug_tracked',
  };
}

// Node: Human review required (stub)
async function humanReview(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[humanReview] Flagged for human review - ${state.classification?.urgency} urgency`);

  // Stub: In a real system with checkpointer, this would use interrupt() for human-in-the-loop
  return {
    status: 'pending_human_review',
    responseText: `[REQUIRES HUMAN REVIEW] This email has been flagged for manual review due to ${state.classification?.intent} intent with ${state.classification?.urgency} urgency.`,
  };
}

// Node: Draft response using LLM
async function draftResponse(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[draftResponse] Drafting response...`);

  const llm = createLLM();

  const context = state.searchResults?.join('\n') || 'No additional context available';

  const draftPrompt = `
You are a helpful customer support agent. Draft a professional response to this email.

Original Email:
${state.emailContent}

Classification:
- Intent: ${state.classification?.intent}
- Urgency: ${state.classification?.urgency}
- Summary: ${state.classification?.summary}

Additional Context:
${context}

Write a helpful, empathetic, and concise response. Do not include subject line.
`;

  const response = await llm.invoke(draftPrompt);
  const responseText = typeof response.content === 'string' ? response.content : '';

  return {
    responseText,
    status: 'response_drafted',
  };
}

// Node: Send reply (finalize)
async function sendReply(state: EmailAgentStateType): Promise<Partial<EmailAgentStateType>> {
  console.log(`[sendReply] Sending response to ${state.senderEmail}`);

  // Stub: In a real system, this would send via email API
  return {
    status: 'sent',
  };
}

// Build and compile the workflow graph
export function createEmailAgentWorkflow() {
  const workflow = new StateGraph(EmailAgentState)
    // Add all nodes
    .addNode('readEmail', readEmail)
    .addNode('classifyIntent', classifyIntent)
    .addNode('searchDocumentation', searchDocumentation)
    .addNode('bugTracking', bugTracking)
    .addNode('humanReview', humanReview)
    .addNode('draftResponse', draftResponse)
    .addNode('sendReply', sendReply)

    // Define edges
    .addEdge(START, 'readEmail')
    .addEdge('readEmail', 'classifyIntent')

    // Conditional routing after classification
    .addConditionalEdges('classifyIntent', routeAfterClassification, [
      'searchDocumentation',
      'bugTracking',
      'humanReview',
      'draftResponse',
    ])

    // All paths lead to draftResponse (except humanReview which goes to END)
    .addEdge('searchDocumentation', 'draftResponse')
    .addEdge('bugTracking', 'draftResponse')
    .addEdge('humanReview', END)

    // Draft to send to end
    .addEdge('draftResponse', 'sendReply')
    .addEdge('sendReply', END);

  return workflow.compile();
}
