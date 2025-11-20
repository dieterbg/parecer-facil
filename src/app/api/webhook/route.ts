import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

        if (!n8nUrl) {
            console.error('NEXT_PUBLIC_N8N_WEBHOOK_URL is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log('Proxying request to n8n:', n8nUrl);

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('n8n error:', text);
            return NextResponse.json({ error: text }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
    }
}
