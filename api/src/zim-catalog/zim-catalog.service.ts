import { Injectable } from '@nestjs/common';

export interface ZimEntry {
  fileName: string;
  url: string;
  hasImages: boolean;
  lang: string;
}

@Injectable()
export class ZimCatalogService {
  private readonly baseUrl = 'https://download.kiwix.org/zim/wikipedia';

  async getAvailable(lang: string): Promise<ZimEntry[]> {
    const response = await fetch(`${this.baseUrl}/`);
    const html = await response.text();
    return this.parseDirectoryListing(html, lang);
  }

  parseDirectoryListing(html: string, lang: string): ZimEntry[] {
    const regex = new RegExp(
      `<a href="(wikipedia_${lang}_[^"]+\\.zim)">[^<]+</a>`,
      'g',
    );
    const entries: ZimEntry[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const fileName = match[1];
      const hasImages = !fileName.includes('nopic');
      entries.push({
        fileName,
        url: `${this.baseUrl}/${fileName}`,
        hasImages,
        lang,
      });
    }

    return entries;
  }
}
