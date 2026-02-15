export interface ImageClassification {
  className: string;
  probability: number;
}

export interface ObjectDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface RecognitionResult {
  imageUrl: string;
  classifications: ImageClassification[];
  objects?: ObjectDetection[];
  dominantCategory?: string;
  suggestedTags: string[];
  processingTime: number;
}

export interface ProductMatch {
  productId: string;
  similarity: number;
  category: string;
  name: string;
  imageUrl: string;
}

export interface VisualSearchResult {
  query: string;
  matches: ProductMatch[];
  totalResults: number;
}

export enum RecognitionModel {
  MOBILENET = 'mobilenet',
  COCO_SSD = 'coco-ssd'
}
