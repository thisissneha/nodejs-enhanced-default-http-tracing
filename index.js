require('./tracing') // Load tracing file

const express = require('express');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// Initialize Express
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// AWS SDK clients
const s3Client = new S3Client({ region: process.env.REGION });
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

// S3: Fetch user profile JSON from S3 bucket
async function fetchUserProfileFromS3(userId) {
    const params = {
        Bucket: 'user-sample-bucket',
        Key: `users/${userId}/profile.json`,
    };

    try {
        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);

        let userProfile = '';
        for await (const chunk of data.Body) {
            userProfile += chunk;
        }

        return JSON.parse(userProfile);
    } catch (err) {
        throw new Error('Error fetching user profile from S3: ' + err.message);
    }
}

// S3: Upload user profile to S3 bucket
async function uploadUserProfileToS3(userId, userProfile) {
    const params = {
        Bucket: 'user-sample-bucket',
        Key: `users/${userId}/profile.json`,
        Body: JSON.stringify(userProfile),
        ContentType: 'application/json'
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
    } catch (err) {
        throw new Error('Error uploading user profile to S3: ' + err.message);
    }
}

// DynamoDB: Fetch user record from DynamoDB
async function fetchUserRecordFromDynamoDB(userId) {
    const params = {
        TableName: 'Users',
        Key: { userId: userId },
    };

    try {
        const command = new GetItemCommand(params);
        const data = await dynamoDBClient.send(command);
        return data.Item;
    } catch (err) {
        throw new Error('Error fetching user record from DynamoDB: ' + err.message);
    }
}

// DynamoDB: Store or update user record in DynamoDB
async function storeUserRecordInDynamoDB(userId, userData) {
  console.log("User data ==> ", userData)
    const params = {
        TableName: 'Users',
        Item: {
          "userId": { "S": userId },  // UserId as string
          "Data": {
              "M": {
                  "Age": { "N": userData.age.toString() },
                  "LoyaltyPoints": { "N": userData.loyaltyPoints.toString() }
              }
          }
      },
    };

    try {
        const command = new PutItemCommand(params);
        await dynamoDBClient.send(command);
    } catch (err) {
        throw new Error('Error storing user record in DynamoDB: ' + err.message);
    }
}

// API: GET user data
app.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Step 1: Fetch profile from S3
        const userProfile = await fetchUserProfileFromS3(userId);

        // Step 2: Fetch additional data from DynamoDB
        const userRecord = await fetchUserRecordFromDynamoDB(userId);

        res.status(200).json({
            message: 'User data retrieved successfully',
            profile: userProfile,
            record: userRecord
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: POST user data
app.post('/user', async (req, res) => {
    const { userId, profile, data } = req.body;
    console.log("{ userId, profile, data } ==> ", { userId, profile, data })

    try {
        // Step 1: Upload user profile to S3
        await uploadUserProfileToS3(userId, profile);

        // Step 2: Store user record in DynamoDB
        await storeUserRecordInDynamoDB(userId, data);

        res.status(200).json({ message: 'User data stored successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
