import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { PubSubPublisher } from './infrastructure/PubSubPublisher';
import { SubmitInquiry } from './application/SubmitInquiry';
import { InquiryData, ValidationError } from './domain/Inquiry';

// 環境変数をロード
// Note: Cloud Runにデプロイする際、このファイルは削除するか、デプロイ方法を変更する必要があります。
// 簡便のため、ここでは直接設定する方法を後述します。
dotenv.config({ path: '.env.development' }); 

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const TOPIC_ID = process.env.PUBSUB_TOPIC_ID!;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; 

// 依存関係の注入（DI）
const pubSubPublisher = new PubSubPublisher(PROJECT_ID, TOPIC_ID);
const submitInquiry = new SubmitInquiry(pubSubPublisher);

const app = express();

// --- ミドルウェア設定 ---
app.use(helmet());
app.use(express.json());

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); 
    }
    next();
});

// --- ルーティング ---

/**
 * POST /api/contact : お問い合わせの送信エンドポイント
 */
app.post('/api/contact', async (req: Request, res: Response) => {
    const rawData: InquiryData = req.body;

    try {
        await submitInquiry.execute(rawData);
        
        // 202 Accepted: 非同期処理を受け付けたことを示す
        return res.status(202).json({ 
            message: 'お問い合わせを受け付けました。処理は非同期で実行されます。',
            status: 'accepted'
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            // 400 Bad Request: クライアント側の入力ミス
            return res.status(400).json({ 
                message: error.message, 
                status: 'validation_error' 
            });
        }
        // 500 Internal Server Error: サーバー側の問題
        console.error('Internal Server Error:', error);
        return res.status(500).json({ 
            message: 'システムエラーが発生しました。時間をおいて再度お試しください。',
            status: 'server_error'
        });
    }
});

// --- サーバーの起動 ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Allowed Origin: ${ALLOWED_ORIGIN}`);
});
