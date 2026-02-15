import { Request, Response } from 'express';
import { SitemapGenerator } from '../services/SitemapGenerator';

export class SeoController {
    private generator: SitemapGenerator;

    constructor() {
        this.generator = new SitemapGenerator();
    }

    public getSitemapIndex(req: Request, res: Response) {
        try {
            const xml = this.generator.generateSitemapIndex();
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } catch (error) {
            res.status(500).send('Error generating sitemap index');
        }
    }

    public getUrlSet(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const xml = this.generator.generateUrlSet(id);
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } catch (error) {
            res.status(500).send('Error generating sitemap');
        }
    }
}
