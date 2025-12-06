import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    // Create indices if they don't exist
    await this.createIndex('users');
  }

  async createIndex(index: string) {
    try {
      const checkIndex = await this.elasticsearchService.indices.exists({ index });
      if (!checkIndex) {
        await this.elasticsearchService.indices.create({
          index,
          body: {
            mappings: {
              properties: {
                id: { type: 'integer' },
                email: { type: 'text', analyzer: 'standard' },
                firstName: { type: 'text', analyzer: 'standard' },
                lastName: { type: 'text', analyzer: 'standard' },
                role: { type: 'keyword' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        console.log(`Index ${index} created.`);
      }
    } catch (error) {
      console.error(`Error creating index ${index}:`, error);
    }
  }

  async indexUser(user: any) {
    try {
      return await this.elasticsearchService.index({
        index: 'users',
        id: user.id.toString(),
        body: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Error indexing user:', error);
    }
  }

  async searchUsers(query: string) {
    try {
      const result = await this.elasticsearchService.search({
        index: 'users',
        body: {
          query: {
            multi_match: {
              query,
              fields: ['email', 'firstName', 'lastName'],
              fuzziness: 'AUTO', // Enable fuzzy matching
            },
          },
        },
      });

      return result.hits.hits.map((hit) => hit._source);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async removeUser(userId: number) {
    try {
      await this.elasticsearchService.delete({
        index: 'users',
        id: userId.toString(),
      });
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }
}
