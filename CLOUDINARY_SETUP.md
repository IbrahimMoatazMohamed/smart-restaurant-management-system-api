# Cloudinary Image Upload Setup

This project now supports image uploads to Cloudinary with multi-tenant organization.

## Configuration

1. **Add Cloudinary URL to your `.env` file:**

   ```env
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   ```

2. **Get your Cloudinary credentials:**
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Go to your Dashboard
   - Copy the "Cloudinary URL" from the Account Details section

## API Endpoints

All upload endpoints require authentication (JWT token) and include the tenant ID in the URL.

### Upload Image

```
POST /:tenantId/upload/image
Content-Type: multipart/form-data

Body:
- file: Image file (jpg, jpeg, png, gif, webp, bmp, tiff)
```

### Upload Image to Specific Folder

```
POST /:tenantId/upload/image/:folder
Content-Type: multipart/form-data

Body:
- file: Image file

Examples:
- POST /restaurant1/upload/image/menu-items
- POST /restaurant1/upload/image/users
- POST /restaurant1/upload/image/restaurants
```

### Delete Image

```
DELETE /:tenantId/upload/image/:publicId

Example:
DELETE /restaurant1/upload/image/smart-restaurant%2Frestaurant1%2Fmenu-items%2Fpizza_1234567890
```

## Folder Structure in Cloudinary

Images are organized by tenant and folder:

```
smart-restaurant/
├── tenant1/
│   ├── menu-items/
│   ├── users/
│   └── restaurants/
├── tenant2/
│   ├── menu-items/
│   ├── users/
│   └── restaurants/
└── ...
```

## File Limits

- **Maximum file size:** 10MB (Cloudinary free plan limit)
- **Supported formats:** JPG, JPEG, PNG, GIF, WEBP, BMP, TIFF
- **Monthly credits:** 25 (as per your Cloudinary plan)
- **Admin API limit:** 500 requests/month

## Usage Examples

### Frontend Upload (JavaScript)

```javascript
const uploadImage = async (tenantId, file, folder = '') => {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint = folder
    ? `/${tenantId}/upload/image/${folder}`
    : `/${tenantId}/upload/image`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
    body: formData,
  });

  return response.json();
};

// Upload to general folder
await uploadImage('restaurant1', imageFile);

// Upload to specific folder
await uploadImage('restaurant1', imageFile, 'menu-items');
```

### Response Format

```json
{
  "message": "Image uploaded successfully",
  "data": {
    "public_id": "smart-restaurant/restaurant1/menu-items/pizza_1234567890",
    "secure_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/smart-restaurant/restaurant1/menu-items/pizza_1234567890.jpg",
    "url": "http://res.cloudinary.com/your-cloud/image/upload/v1234567890/smart-restaurant/restaurant1/menu-items/pizza_1234567890.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "resource_type": "image",
    "bytes": 245760
  }
}
```

## Integration with Existing Services

You can now use the `CloudinaryUploadService` in your existing services:

```typescript
import { CloudinaryUploadService } from '../file-upload/cloudinary-upload.service';

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  async createMenuItem(
    data: CreateMenuItemDto,
    image: Express.Multer.File,
    tenantId: string,
  ) {
    // Upload image to Cloudinary
    const uploadResult = await this.cloudinaryUploadService.uploadImage(
      image,
      tenantId,
      'menu-items',
    );

    // Save menu item with Cloudinary URL
    const menuItem = {
      ...data,
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    };

    return this.menuItemRepository.save(menuItem);
  }
}
```

## Features

- ✅ Multi-tenant file organization
- ✅ Automatic image optimization
- ✅ File validation and size limits
- ✅ Secure upload with JWT authentication
- ✅ Image deletion support
- ✅ Optimized image URL generation
- ✅ Error handling and logging

## Notes

- Images are automatically optimized by Cloudinary
- The `secure_url` should be used for HTTPS environments
- Store the `public_id` in your database for deletion purposes
- The free plan includes 25 monthly credits and 500 admin API calls
