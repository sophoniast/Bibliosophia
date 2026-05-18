import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { question = "", readingTitle = "the selected reading", selectedEntry = null } = await request.json()

  const selectedWordLine = selectedEntry
    ? `The selected word is ${selectedEntry.lemma} (${selectedEntry.translit}, ${selectedEntry.strongs}), which in this passage emphasizes ${String(selectedEntry.def).toLowerCase()}.`
    : "No lexical item is currently selected, so the response stays at the broader passage level."

  const answer =
    `${readingTitle} foregrounds theology through literary density rather than sheer narrative speed.\n\n` +
    `${selectedWordLine}\n\n` +
    "A strong first-pass reading question is how the passage frames divine agency, revelation, and human response. This response is now served from your Supabase edge runtime so the app no longer depends on a local Express server.\n\n" +
    `Prompt received: “${String(question).trim()}”`

  return new Response(JSON.stringify({ answer }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status: 200,
  })
})
