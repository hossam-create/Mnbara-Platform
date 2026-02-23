import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Images')
@Controller('api/images')
export class ImageController {
  @Post('upload')
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  async getUploadUrl(@Body() body: any) {
    return {
      success: true,
      data: {
        uploadUrl: `https://mock-storage.example.com/upload/${body.productId}/${body.fileName}`,
        fileUrl: `https://mock-storage.example.com/files/${body.productId}/${body.fileName}`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    };
  }

  @Post('thumbnail')
  @ApiOperation({ summary: 'Generate thumbnail' })
  async generateThumbnail(@Body() body: any) {
    return {
      success: true,
      data: { thumbnailUrl: body.imageUrl + '?w=' + (body.width || 200) + '&h=' + (body.height || 200) },
    };
  }

  @Delete(':productId/:imageId')
  @ApiOperation({ summary: 'Delete image' })
  async deleteImage(@Param('productId') productId: string, @Param('imageId') imageId: string) {
    return { success: true, message: 'Image deleted', data: { productId, imageId } };
  }
}
