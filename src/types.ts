export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  author: string;
  message: string;
  profilePic: string;
}

export interface PhotoMetadata {
  totalPhotos: number;
  activeUsers: number;
}