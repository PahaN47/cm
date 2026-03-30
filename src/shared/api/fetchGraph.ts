export async function fetchGraph(): Promise<string> {
    const res = await fetch('/api/graph');
    if (!res.ok) throw new Error(`fetchGraph failed: ${res.status}`);
    return res.text();
}
