

export const parseBBCode = (text: string): string => {
    if (!text) return '';

    // If the text looks like HTML (contains tags), return it directly.
    // We assume the admin input is trusted or sanitized elsewhere if needed.
    // However, we still support BBCode parsing if mixed.
    let html = text;

    // Bold, Italic, Underline
    html = html.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');
    html = html.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>');
    html = html.replace(/\[u\](.*?)\[\/u\]/gi, '<ins>$1</ins>');

    // Headings
    html = html.replace(/\[h1\](.*?)\[\/h1\]/gi, '<h1 class="text-3xl font-black mb-4">$1</h1>');
    html = html.replace(/\[h2\](.*?)\[\/h2\]/gi, '<h2 class="text-2xl font-black mb-3">$1</h2>');
    html = html.replace(/\[h3\](.*?)\[\/h3\]/gi, '<h3 class="text-xl font-black mb-2">$1</h3>');

    // Links
    html = html.replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" class="text-accent underline hover:no-underline">$2</a>');
    html = html.replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" class="text-accent underline hover:no-underline">$1</a>');

    // Images
    html = html.replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" alt="image" class="w-full h-auto rounded-xl my-8 shadow-lg" />');

    // Lists
    html = html.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (match, p1) => {
        const items = p1.trim().split('\n').filter((item: string) => item.trim()).map((item: string) => `<li>${item.replace(/^\*?\s*/, '')}</li>`).join('');
        return `<ul class="list-disc pl-6 my-4 space-y-2">${items}</ul>`;
    });

    // Quotes
    html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-accent bg-slate-50 p-6 my-6 italic text-slate-700">$1</blockquote>');

    // Only convert newlines to <br> if it doesn't look like raw HTML block
    if (!html.includes('<p>') && !html.includes('<div>')) {
        html = html.replace(/\n/g, '<br />');
    }

    return html;
};
