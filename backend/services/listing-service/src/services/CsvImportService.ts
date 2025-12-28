import { Readable } from 'stream';
import { parse } from 'csv-parse';

export interface BulkImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export class CsvImportService {

    /**
     * Process a CSV stream of listings.
     * Expected format: Title, Price, Quantity, Description, Category
     */
    public async processUpload(fileBuffer: Buffer): Promise<BulkImportResult> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const errors: string[] = [];
            let rowCount = 0;

            const stream = Readable.from(fileBuffer);
            
            const parser = stream.pipe(parse({
                columns: true,
                trim: true,
                skip_empty_lines: true
            }));

            parser.on('readable', () => {
                let record;
                while ((record = parser.read()) !== null) {
                    rowCount++;
                    if (this.validateRecord(record)) {
                        results.push(record);
                        // TODO: Batch insert into DB using Prisma
                    } else {
                        errors.push(`Row ${rowCount}: Invalid data`);
                    }
                }
            });

            parser.on('error', (err) => {
                reject(err);
            });

            parser.on('end', () => {
                // Simulate DB insertion delay
                setTimeout(() => {
                    resolve({
                        total: rowCount,
                        success: results.length,
                        failed: errors.length,
                        errors: errors.slice(0, 10) // Limit errors returned
                    });
                }, 100);
            });
        });
    }

    private validateRecord(record: any): boolean {
        // Basic validation
        if (!record.Title || !record.Price) return false;
        if (isNaN(Number(record.Price))) return false;
        return true;
    }
}
