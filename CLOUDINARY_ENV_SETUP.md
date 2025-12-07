# Cloudinary Environment Setup Guide

## Error: "Must supply api_key"

This error occurs when the `CLOUDINARY_URL` environment variable is not properly configured.

## Step-by-Step Setup:

### 1. Get Your Cloudinary Credentials

1. **Sign up/Login** to [Cloudinary](https://cloudinary.com/)
2. **Go to Dashboard** - You'll see your account details
3. **Copy the "Cloudinary URL"** - It looks like this:
   ```
   cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name
   ```

### 2. Add to Your .env File

Create or update your `.env` file in the server root directory:

```env
# Cloudinary Configuration
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

# Example (replace with your actual values):
# CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@my-restaurant-app
```

### 3. Verify Your .env File

Make sure your `.env` file contains:

- ✅ `CLOUDINARY_URL=cloudinary://...` (starts with `cloudinary://`)
- ✅ No spaces around the `=` sign
- ✅ No quotes around the URL
- ✅ File is in the correct location (`/server/.env`)

### 4. Restart Your Application

After adding the environment variable:

```bash
# Stop the current process (Ctrl+C)
# Then restart:
npm run start:dev
```

## Troubleshooting:

### Issue: Environment variable not loading

**Solution**: Make sure your `.env` file is in the correct location:

```
smart-restaurant/
├── server/
│   ├── .env          ← Should be here
│   ├── src/
│   └── package.json
└── client/
```

### Issue: Invalid format error

**Solution**: Ensure the URL format is exactly:

```
cloudinary://api_key:api_secret@cloud_name
```

### Issue: Still getting "Must supply api_key"

**Solutions**:

1. **Check file name**: Must be `.env` (not `env.txt` or `.env.local`)
2. **Check file encoding**: Should be UTF-8
3. **Check for typos**: `CLOUDINARY_URL` (all caps, underscore)
4. **Restart application**: Environment variables are loaded on startup

## Verification:

When properly configured, you should see these logs on startup:

```
[CloudinaryConfig] Configuring Cloudinary...
[CloudinaryConfig] Cloudinary configured successfully for cloud: your-cloud-name
```

## Security Notes:

- ✅ **Never commit** your `.env` file to version control
- ✅ **Add `.env` to `.gitignore`** (should already be there)
- ✅ **Use different credentials** for development and production
- ✅ **Keep your API secret secure**

## Production Deployment:

For serverless/production environments, set the environment variable through your platform:

- **AWS Lambda**: Environment variables in function configuration
- **Vercel**: Environment variables in project settings
- **Netlify**: Environment variables in site settings
- **Heroku**: Config vars in app settings

## Example Working Configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=smart_restaurant

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# API
API_BASE_URL=http://localhost:3030

# Cloudinary (REQUIRED for file uploads)
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name
```

## Need Help?

If you're still having issues:

1. Check the application logs for specific error messages
2. Verify your Cloudinary dashboard shows the correct credentials
3. Try creating a new API key from your Cloudinary dashboard
4. Ensure no special characters are causing parsing issues
