import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Works with Supabase Storage (S3 protocol), AWS S3, and R2.
const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_KEY!, secretAccessKey: process.env.S3_SECRET! },
});
const Bucket = process.env.S3_BUCKET!; // private bucket; set 5 MB limit and allowed types on it

export const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export const uploadUrl = (Key: string, type: string) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType: type }), { expiresIn: 300 });
export const viewUrl = (Key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 60 });
