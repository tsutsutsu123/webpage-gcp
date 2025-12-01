import { PubSub } from '@google-cloud/pubsub';
import { Inquiry } from '../domain/Inquiry';

/**
 * Pub/Subへのメッセージ発行インターフェース
 * 責務：外部サービスの操作を抽象化
 */
export interface Publisher {
    publish(inquiry: Inquiry): Promise<void>;
}

/**
 * Pub/SubPublisherクラス
 * 責務：Google Cloud Pub/Subへの接続と具体的なメッセージ発行処理
 */
export class PubSubPublisher implements Publisher {
    private pubsub: PubSub;
    private topicId: string;
    private projectId: string;

    constructor(projectId: string, topicId: string) {
        this.projectId = projectId;
        this.topicId = topicId;
        // PubSubクライアントの初期化。環境変数から認証情報を自動的に取得します。
        this.pubsub = new PubSub({ projectId: this.projectId });
    }

    /**
     * お問い合わせデータをJSON形式でPub/Subトピックに発行する
     * @param inquiry 発行するお問い合わせデータ
     */
    public async publish(inquiry: Inquiry): Promise<void> {
        const dataBuffer = Buffer.from(JSON.stringify(inquiry));

        try {
            const messageId = await this.pubsub.topic(this.topicId).publishMessage({ data: dataBuffer });
            console.log(`Message ${messageId} published to topic ${this.topicId}.`);
        } catch (error) {
            // 発行失敗は重要なエラーであり、ここでロギングと再スローを行う
            console.error(`ERROR publishing message: ${error}`);
            throw new Error('メッセージの発行に失敗しました。時間をおいて再度お試しください。');
        }
    }
}
