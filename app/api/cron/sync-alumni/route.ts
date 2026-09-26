import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini and Supabase
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS in cron
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Verify Vercel Cron Authentication (Security)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch up to 100 oldest-synced alumni who have a LinkedIn URL
    const { data: alumni, error: fetchError } = await supabase
      .from('alumni_profiles')
      .select('id, full_name, linkedin_url')
      .not('linkedin_url', 'is', null)
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(100);

    if (fetchError) throw fetchError;
    if (!alumni || alumni.length === 0) {
      return NextResponse.json({ message: 'No alumni to sync.' });
    }

    let updatedCount = 0;

    // 3. Process each alumni
    for (const person of alumni) {
      try {
        if (!person.linkedin_url || !person.full_name) continue;

        let searchSnippets = "";

        // 4. Fetch the LinkedIn Snippet from Google Custom Search
        if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
          const query = encodeURIComponent(`site:linkedin.com/in/ "${person.full_name}" IMED`);
          const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${query}`;
          
          try {
            const googleRes = await fetch(url);
            const googleData = await googleRes.json();
            
            if (googleData.items && googleData.items.length > 0) {
               // Combine the snippets from the top 3 results to give Gemini enough context
               searchSnippets = googleData.items.slice(0, 3).map((item: any) => item.snippet).join('\n');
            }
          } catch (e) {
            console.error(`Google search failed for ${person.id}`, e);
          }
        }

        // Skip if no snippet found to save Gemini API calls
        if (!searchSnippets) {
          // Still mark as synced so we don't get stuck in a loop
          await supabase.from('alumni_profiles').update({ last_synced_at: new Date().toISOString() }).eq('id', person.id);
          continue;
        }

        // 5. Use Gemini AI to extract current company and role
        const prompt = `
          Extract the CURRENT role title and CURRENT company name from the following scraped LinkedIn profile Google Search snippets.
          Return ONLY a JSON object with exactly these keys: "role_title", "current_company".
          If you cannot find it, return null for those fields.

          Scraped Data:
          ${searchSnippets}
        `;

        const interaction = await client.interactions.create({
          model: 'gemini-3.5-flash-lite',
          input: prompt,
          response_format: [
            {
              type: "text",
              mime_type: "application/json",
              schema: {
                type: "object",
                properties: {
                  role_title: { type: "string" },
                  current_company: { type: "string" }
                },
                required: ["role_title", "current_company"]
              }
            }
          ]
        });

        const extractedData = interaction.output_text;
        if (!extractedData) throw new Error("AI returned empty response");
        
        const parsed = JSON.parse(extractedData);

        // 6. Update the alumni record in Supabase
        await supabase
          .from('alumni_profiles')
          .update({
            current_company: parsed.current_company || null,
            role_title: parsed.role_title || null,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', person.id);
          
        updatedCount++;
      } catch (innerError) {
        console.error(`Failed to sync alumni ${person.id}:`, innerError);
      }
    }

    return NextResponse.json({ success: true, updatedCount, totalChecked: alumni.length });

  } catch (error: any) {
    console.error("Cron Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
