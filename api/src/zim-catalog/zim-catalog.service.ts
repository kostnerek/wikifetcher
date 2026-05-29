import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface ZimEntry {
  fileName: string;
  url: string;
  hasImages: boolean;
  lang: string;
}

@Injectable()
export class ZimCatalogService {
  private readonly logger = new Logger(ZimCatalogService.name);
  private readonly baseUrl = 'https://download.kiwix.org/zim/wikipedia';

  async getAvailable(lang: string): Promise<ZimEntry[]> {
    const html = await this.fetchListing();
    return this.parseDirectoryListing(html, lang);
  }

  async getLanguages(): Promise<string[]> {
    const html = await this.fetchListing();
    const regex = /<a href="wikipedia_([^_"]+)_[^"]+\.zim">/g;
    const langs = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      langs.add(match[1]);
    }
    return [...langs].sort();
  }

  private async fetchListing(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        this.logger.error(`Kiwix catalog returned ${response.status}`);
        throw new ServiceUnavailableException('Kiwix catalog unavailable');
      }
      return await response.text();
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(
        `Failed to fetch Kiwix catalog: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException('Kiwix catalog unreachable');
    }
  }

  parseDirectoryListing(html: string, lang: string): ZimEntry[] {
    const safeLang = this.escapeRegex(lang);
    const regex = new RegExp(
      `<a href="(wikipedia_${safeLang}_[^"]+\\.zim)">[^<]+</a>`,
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

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
