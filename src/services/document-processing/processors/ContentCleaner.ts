// processors/ContentCleaner.ts
export class ContentCleaner {
  async cleanContent(rawContent: string): Promise<string> {
    let content = rawContent;

    content = content.replace(/<[^>]*>/g, ' ');
    content = content.normalize('NFKC');
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    content = content.replace(/[ \t]+/g, ' ');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    const lines = content.split('\n');
    const meaningfulLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 2 || /[.!?:]$/.test(trimmed) || /^#+\s/.test(trimmed);
    });
    
    content = meaningfulLines.join('\n');
    content = content.replace(/[.]{4,}/g, '...');
    content = content.replace(/[!]{2,}/g, '!');
    content = content.replace(/[?]{2,}/g, '?');
    content = content.trim();

    console.log(`📝 Content cleaned: ${rawContent.length} → ${content.length} characters`);
    return content;
  }
}