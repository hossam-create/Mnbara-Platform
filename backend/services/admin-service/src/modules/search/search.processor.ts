import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SearchService } from './search.service';

@Processor('search-queue')
export class SearchProcessor extends WorkerHost {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'index-user':
        await this.searchService.indexUser(job.data);
        break;
      case 'remove-user':
        await this.searchService.removeUser(job.data.userId);
        break;
      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  }
}
