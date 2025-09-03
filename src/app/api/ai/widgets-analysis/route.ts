import { NextRequest, NextResponse } from 'next/server';
import { createParser } from 'eventsource-parser';
import * as z from 'zod';

// Input schema (loose to avoid tight coupling with internal types while enforcing minimum shape)
const widgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  apiEndpointId: z.string().optional(),
  apiUrl: z.string().optional(),
  refreshInterval: z.number().int().positive(),
  displayType: z.string(),
  config: z
    .object({
        selectedFields: z.array(z.string()).default([]),
        fieldMappings: z.record(z.string(), z.string()).optional(),
        formatSettings: z.any().optional(),
        styling: z.any().optional(),
    })
    .passthrough(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  isImported: z.boolean().optional(),
});

const apiEndpointLiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  url: z.string().optional(),
});

const analysisSchema = z.object({
  widgets: z.array(widgetSchema).min(1),
  apiEndpoints: z.array(apiEndpointLiteSchema).optional(),
  widgetData: z.record(z.string(), z.any()).optional(),
  message: z.string().max(400).optional(),
  mode: z.enum(['full', 'quick']).optional().default('full'),
});

// Basic in-memory rate limit (shared with nothing else for now)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 min
const RATE_LIMIT_MAX_REQUESTS = 15;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  return 'unknown';
}

function checkRateLimit(clientIP: string) {
  const now = Date.now();
  const rec = rateLimitStore.get(clientIP);
  if (!rec || now > rec.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  if (rec.count >= RATE_LIMIT_MAX_REQUESTS) return { allowed: false, remaining: 0 };
  rec.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - rec.count };
}

interface MetricSummary {
  totalWidgets: number;
  byDisplayType: Record<string, number>;
  avgRefreshInterval: number;
  minRefreshInterval: number;
  maxRefreshInterval: number;
  duplicateNames: string[];
  endpointUsage: Record<string, { count: number; widgetIds: string[] }>; // apiEndpointId -> info
  orphanWidgets: string[]; // have neither apiEndpointId nor apiUrl
  topFields: { field: string; count: number }[];
  importedCount: number;
}

function analyzeWidgets(input: z.infer<typeof analysisSchema>): { metrics: MetricSummary; notes: string[] } {
  const { widgets, apiEndpoints } = input;
  const byDisplayType: Record<string, number> = {};
  const refreshValues: number[] = [];
  const nameCount: Record<string, number> = {};
  const endpointUsage: Record<string, { count: number; widgetIds: string[] }> = {};
  const orphanWidgets: string[] = [];
  const fieldCount: Record<string, number> = {};
  let importedCount = 0;

  widgets.forEach(w => {
    byDisplayType[w.displayType] = (byDisplayType[w.displayType] || 0) + 1;
    refreshValues.push(w.refreshInterval);
    nameCount[w.name] = (nameCount[w.name] || 0) + 1;
    if (w.apiEndpointId) {
      endpointUsage[w.apiEndpointId] = endpointUsage[w.apiEndpointId] || { count: 0, widgetIds: [] };
      endpointUsage[w.apiEndpointId].count += 1;
      endpointUsage[w.apiEndpointId].widgetIds.push(w.id);
    } else if (!w.apiUrl) {
      orphanWidgets.push(w.id);
    }
    if (w.config?.selectedFields) {
      w.config.selectedFields.forEach(f => {
        fieldCount[f] = (fieldCount[f] || 0) + 1;
      });
    }
    if (w.isImported) importedCount += 1;
  });

  const duplicateNames = Object.entries(nameCount)
    .filter(([, c]) => c > 1)
    .map(([name]) => name);

  const avgRefreshInterval = refreshValues.reduce((a, b) => a + b, 0) / refreshValues.length;
  const minRefreshInterval = Math.min(...refreshValues);
  const maxRefreshInterval = Math.max(...refreshValues);

  const topFields = Object.entries(fieldCount)
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const metrics: MetricSummary = {
    totalWidgets: widgets.length,
    byDisplayType,
    avgRefreshInterval: Number(avgRefreshInterval.toFixed(2)),
    minRefreshInterval,
    maxRefreshInterval,
    duplicateNames,
    endpointUsage,
    orphanWidgets,
    topFields,
    importedCount,
  };

  const notes: string[] = [];
  if (duplicateNames.length) notes.push(`Duplicate widget names detected: ${duplicateNames.join(', ')}`);
  if (orphanWidgets.length) notes.push(`Orphan widgets without endpoint or URL: ${orphanWidgets.join(', ')}`);
  if (maxRefreshInterval > 600) notes.push('Some widgets refresh slower than 10 minutes; consider if they need manual refresh only.');
  if (minRefreshInterval < 10) notes.push('Widgets with very aggressive refresh (<10s) may hit rate limits; evaluate necessity.');
  const heavyEndpoints = Object.entries(endpointUsage).filter(([, v]) => v.count > 3);
  if (heavyEndpoints.length) notes.push(`Endpoints with high fan-out: ${heavyEndpoints.map(([k, v]) => `${k}(${v.count})`).join(', ')} — these are good candidates for shared caching or real-time streaming.`);
  if (apiEndpoints) {
    const endpointIds = new Set(apiEndpoints.map(e => e.id));
    const missingDefs = Object.keys(endpointUsage).filter(id => !endpointIds.has(id));
    if (missingDefs.length) notes.push(`Widgets reference missing API endpoint definitions: ${missingDefs.join(', ')}`);
  }
  if (metrics.topFields.length && metrics.topFields[0].count > widgets.length * 0.6) notes.push(`Field "${metrics.topFields[0].field}" appears in >60% of widgets; consider a global KPI widget.`);

  return { metrics, notes };
}

type LiteWidget = z.infer<typeof widgetSchema>;
type LiteEndpoint = z.infer<typeof apiEndpointLiteSchema>;

function buildAnalysisContext(metrics: MetricSummary, notes: string[], widgets: LiteWidget[], apiEndpoints?: LiteEndpoint[]): string {
  const lines: string[] = [];
  lines.push('=== DASHBOARD WIDGET METRICS SUMMARY ===');
  lines.push(`Total Widgets: ${metrics.totalWidgets}`);
  lines.push('By Display Type: ' + Object.entries(metrics.byDisplayType).map(([k, v]) => `${k}:${v}`).join(', '));
  lines.push(`Refresh Interval (sec) -> avg:${metrics.avgRefreshInterval} min:${metrics.minRefreshInterval} max:${metrics.maxRefreshInterval}`);
  lines.push(`Imported Widgets: ${metrics.importedCount}`);
  if (metrics.duplicateNames.length) lines.push('Duplicate Names: ' + metrics.duplicateNames.join(', '));
  if (metrics.orphanWidgets.length) lines.push('Orphan Widgets: ' + metrics.orphanWidgets.join(', '));
  lines.push('Top Selected Fields: ' + metrics.topFields.map(f => `${f.field}(${f.count})`).join(', '));
  lines.push('Endpoint Usage (top): ' + Object.entries(metrics.endpointUsage)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([id, v]) => `${id}:${v.count}`)
    .join(', '));
  if (notes.length) {
    lines.push('Preliminary Observations:');
    notes.forEach(n => lines.push('- ' + n));
  }
  lines.push('\n=== WIDGET SNAPSHOTS (trimmed) ===');
  widgets.slice(0, 20).forEach((w) => {
    lines.push(
      `# ${w.name} | type=${w.displayType} refresh=${w.refreshInterval}s fields=${(w.config?.selectedFields || []).slice(0,6).join(',')} endpoint=${w.apiEndpointId || w.apiUrl || 'none'}`
    );
  });
  if (widgets.length > 20) lines.push(`(… ${widgets.length - 20} more widgets omitted for brevity)`);
  if (apiEndpoints?.length) {
    lines.push('\n=== API ENDPOINTS (lite) ===');
    apiEndpoints.slice(0, 25).forEach(e => lines.push(`* ${e.id} | ${e.name} | ${e.category || 'uncategorized'}`));
    if (apiEndpoints.length > 25) lines.push(`(… ${apiEndpoints.length - 25} more endpoints omitted)`);
  }
  return lines.join('\n');
}

function buildSystemPrompt(mode: 'full' | 'quick'): string {
  const base = `You are an expert financial dashboard optimization assistant.
Given widget configuration metadata you will:
1. Provide a concise executive summary.
2. Identify structural & configuration issues (naming, duplication, refresh cadence, endpoint fan-out, field overuse, missing mappings).
3. Recommend actionable improvements (real-time candidates, consolidation, new KPI widgets, performance tuning, normalization ideas).
4. Suggest 3-6 high-impact new widgets (with purpose & required fields) based ONLY on observed patterns (do not hallucinate unknown data sources).
5. If mode=quick keep answer < 350 tokens; otherwise you may use up to 650 tokens.
Output sections with clear markdown headings: Summary, Issues, Recommendations, Proposed Widgets.`;
  if (mode === 'quick') return base + '\nBe succinct.';
  return base;
}

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rate = checkRateLimit(clientIP);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many requests', retryAfter: RATE_LIMIT_WINDOW / 1000 }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = analysisSchema.parse(body);

    const { metrics, notes } = analyzeWidgets(parsed);
    const context = buildAnalysisContext(metrics, notes, parsed.widgets, parsed.apiEndpoints);
    const system = buildSystemPrompt(parsed.mode);
    const userMessage = parsed.message || 'Provide a full analysis now.';

    // Construct Gemini streaming request body (mimic chat format)
    const requestBody = {
      contents: [
        { role: 'user', parts: [{ text: system }] },
        { role: 'model', parts: [{ text: 'I will analyze the provided configuration.' }] },
        { role: 'user', parts: [{ text: context + '\n\nUser Instruction: ' + userMessage }] },
      ],
      generationConfig: {
        maxOutputTokens: parsed.mode === 'quick' ? 500 : 900,
        temperature: 0.6,
        topP: 0.8,
        topK: 40,
      },
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?alt=sse&key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const parser = createParser({
            onEvent: (event) => {
              if (!event.data) return;
              try {
                const data = JSON.parse(event.data);
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {
                // ignore non-JSON keep-alives
              }
            },
          });

            if (!response.body) throw new Error('No response body');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              parser.feed(decoder.decode(value));
            }
            controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
            controller.close();
  } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rate.remaining.toString(),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
