# Band Sheets AWS Deployment Guide

This guide walks through deploying the Band Sheets application to AWS, with the frontend on AWS Amplify and the backend on AWS Elastic Beanstalk.

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure the AWS CLI on your local machine
3. **MongoDB Atlas**: A MongoDB Atlas account for the database (or use AWS DocumentDB)

## Step 1: Set Up MongoDB Atlas

1. Create a MongoDB Atlas cluster if you don't have one
2. Create a database user with appropriate permissions
3. Whitelist all IP addresses (0.0.0.0/0) for AWS access
4. Get your MongoDB connection string

## Step 2: Deploy Backend to AWS Elastic Beanstalk

1. **Install EB CLI**:
   ```
   pip install awsebcli
   ```

2. **Initialize EB Application** (from the `band-sheets-backend` directory):
   ```
   cd band-sheets-backend
   eb init
   ```
   - Select your region
   - Create a new application (e.g., "band-sheets-api")
   - Select "Node.js" as the platform
   - Choose to set up SSH for your instances

3. **Create EB Environment**:
   ```
   eb create band-sheets-api-prod
   ```

4. **Configure Environment Variables** in the AWS Console:
   - Go to Elastic Beanstalk > Environments > band-sheets-api-prod > Configuration
   - Add environment properties:
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A secure random string for JWT signing
     - `JWT_EXPIRE`: Token expiration (e.g., "30d")

5. **Deploy the Backend**:
   ```
   eb deploy
   ```

6. **Get Your API Endpoint**:
   - Note the URL provided by Elastic Beanstalk (e.g., `http://band-sheets-api-prod.eba-xyz123.us-west-2.elasticbeanstalk.com`)

## Step 3: Update Frontend Configuration

1. **Update API URL**:
   - Edit `/band-sheet-creator/.env.production` to use your Elastic Beanstalk URL:
     ```
     REACT_APP_API_URL=http://band-sheets-api-prod.eba-xyz123.us-west-2.elasticbeanstalk.com/api
     REACT_APP_ENV=production
     ```

2. **Build the Frontend**:
   ```
   cd band-sheet-creator
   npm run build
   ```

## Step 4: Deploy Frontend to AWS Amplify

1. **Set Up AWS Amplify**:
   - Go to AWS Amplify Console
   - Choose "Deploy without Git provider" > "Drag and drop"
   - Upload your `band-sheet-creator/build` folder
   - Or connect your GitHub repository for CI/CD

2. **Alternative: Use Amplify CLI**:
   ```
   npm install -g @aws-amplify/cli
   amplify init
   amplify add hosting
   amplify publish
   ```

## Step 5: Set Up Custom Domain (Optional)

1. **Register Domain** in Route 53 or use an existing domain
2. **Configure in Amplify**:
   - Go to Amplify Console > App settings > Domain management
   - Add domain and follow verification steps
3. **Configure in Elastic Beanstalk**:
   - Create CNAME record pointing to your EB environment URL

## Step 6: Set Up CORS

1. **Update Backend CORS Configuration**:
   - Make sure your backend CORS settings allow requests from your Amplify domain

## Step 7: Set Up CloudFront for CDN (Optional)

1. **Create CloudFront Distribution**:
   - Origin: Your Amplify app
   - Configure caching behavior
   - Set up SSL certificate

## Troubleshooting

- **Backend Connection Issues**: Check CORS settings and environment variables
- **Database Connection**: Verify MongoDB Atlas IP whitelist and credentials
- **Deployment Failures**: Check Elastic Beanstalk logs

## Maintenance

- **Updating the Application**:
  - For backend: Make changes, then `eb deploy`
  - For frontend with GitHub: Push to your repository
  - For frontend without GitHub: Rebuild and re-upload to Amplify

## Security Considerations

- Set up AWS WAF for additional security
- Enable HTTPS for all endpoints
- Regularly rotate JWT secrets and database credentials
- Set up CloudWatch alarms for monitoring

## Cost Optimization

- Use AWS Free Tier where possible
- Consider using AWS Lambda for backend if usage is sporadic
- Set up budget alerts to monitor spending
