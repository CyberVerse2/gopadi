import { v2 as cloudinary } from "cloudinary";
import { badRequest } from "../../../lib/http";
import { generateId } from "../../../lib/ids";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary is not configured.");
    }

    const data = await request.formData();
    const image = data.get("image");

    if (!(image instanceof File)) {
      return badRequest("Image file is required.", 400);
    }
    if (!ALLOWED_TYPES.has(image.type)) {
      return badRequest("Only jpg, png, webp, or gif images are supported.", 400);
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return badRequest("Image must be 5MB or smaller.", 400);
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const bytes = Buffer.from(await image.arrayBuffer());
    const base64 = bytes.toString("base64");
    const dataUri = `data:${image.type};base64,${base64}`;
    const ext = EXT_BY_TYPE[image.type];
    const publicId = `gopadi/dispute-evidence/${generateId("chat_img")}.${ext}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
    });

    return Response.json({
      url: result.secure_url,
      name: image.name,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to upload image.", 500);
  }
}
