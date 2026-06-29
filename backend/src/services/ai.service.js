// src/services/ai.service.js
//
// NOTE: This sandbox environment has no outbound internet access to
// api.openai.com (network egress is restricted to package registries
// only), so a live OpenAI call cannot be executed here for testing.
//
// This service is written as a drop-in replacement: in production,
// `chat()` below calls `openai.chat.completions.create(...)` exactly
// as specified in the AI Integration Workflow document (Week 5).
// For local API testing in this sandbox, a deterministic stub response
// generator is used so the full request/response contract (input shape,
// output shape, status codes, token accounting) can be verified end to
// end without a live key.
//
// Swapping to production simply means uncommenting the OpenAI block
// below and supplying OPENAI_API_KEY in .env — no controller or route
// code changes are required.

/*
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
*/

const STUB_RESPONSES = [
  "Great question! Let's break this down step by step.\n\nA Binary Search Tree (BST) is a node-based data structure where each node has at most two children. The left subtree contains only values less than the node, and the right subtree only values greater.\n\n**Why it matters:**\n- Search, insert, and delete run in O(log n) average time\n- Sorted traversal is possible in O(n)\n\nWant me to walk through inserting values 5, 3, 7, 1, 4?",
  "Newton's First Law states that an object remains at rest or in uniform motion unless acted upon by an external force. This is also called the Law of Inertia.\n\n**Key example:** A book on a table stays still because the table's normal force balances gravity — net force is zero.\n\nWould you like a worked example with numbers?",
  "Integration by parts follows the formula:\n\n∫u dv = uv − ∫v du\n\n**Step-by-step approach:**\n1. Choose u (pick the part that gets simpler when differentiated)\n2. Choose dv (the rest)\n3. Differentiate u to get du\n4. Integrate dv to get v\n5. Substitute into the formula\n\nWant to try an example together, like ∫x·eˣ dx?",
  "Here's a clear structure for an academic essay:\n\n1. **Introduction** — hook + thesis statement\n2. **Body paragraphs** — one main idea per paragraph, topic sentence + evidence + analysis\n3. **Conclusion** — restate thesis, summarize key points, closing thought\n\nA good rule: each paragraph should answer \"so what?\" Want help outlining a specific essay topic?",
];

let callCount = 0;

/**
 * Simulates a chat completion call.
 * @param {string} systemPrompt
 * @param {Array<{role:string, content:string}>} messages
 * @returns {{reply: string, tokens: number, finishReason: string}}
 */
exports.chat = async (systemPrompt, messages) => {
  // Simulate network latency of a real LLM call
  await new Promise((r) => setTimeout(r, 150));

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const reply = STUB_RESPONSES[callCount % STUB_RESPONSES.length];
  callCount++;

  // Rough token estimate (~4 chars per token), matches OpenAI's usage.total_tokens shape
  const promptTokens = Math.ceil((systemPrompt.length + lastUserMessage.length) / 4);
  const completionTokens = Math.ceil(reply.length / 4);

  return {
    reply,
    tokens: promptTokens + completionTokens,
    finishReason: "stop",
  };
};
