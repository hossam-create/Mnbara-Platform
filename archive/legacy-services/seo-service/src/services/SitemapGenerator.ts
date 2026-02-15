import { create } from 'xmlbuilder2';

export class SitemapGenerator {

    /**
     * Generates a sitemap index for millions of items.
     * eBay splits sitemaps by category or ID range.
     */
    public generateSitemapIndex(): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('sitemapindex', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

        // Generate 10 sitemaps (simulation)
        for (let i = 1; i <= 10; i++) {
            root.ele('sitemap')
                .ele('loc').txt(`https://mnbara.com/sitemap/listings-${i}.xml`).up()
                .ele('lastmod').txt(new Date().toISOString()).up();
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Generates a specific URL set sitemap.
     */
    public generateUrlSet(id: string): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

        // Simulate 50 URLs per sitemap
        for (let i = 0; i < 50; i++) {
            const itemId = `${id}-${Math.floor(Math.random() * 10000)}`;
            root.ele('url')
                .ele('loc').txt(`https://mnbara.com/item/apple-iphone-15-${itemId}`).up()
                .ele('changefreq').txt('daily').up()
                .ele('priority').txt('0.8').up();
        }

        return root.end({ prettyPrint: true });
    }
}
