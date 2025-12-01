import { Inquiry, InquiryData, ValidationError } from '../domain/Inquiry';
import { Publisher } from '../infrastructure/PubSubPublisher';

/**
 * ユースケース：お問い合わせ送信
 * 責務：ドメインとインフラストラクチャを協調させ、ビジネスフローを実行する
 */
export class SubmitInquiry {
    private publisher: Publisher;

    constructor(publisher: Publisher) {
        this.publisher = publisher;
    }

    /**
     * お問い合わせデータを受け付け、検証し、非同期処理キューへ発行する
     * @param rawData フォームから受信した未検証のデータ
     * @returns 成功フラグ
     */
    public async execute(rawData: InquiryData): Promise<boolean> {
        try {
            // 1. ドメイン層に検証を依頼し、有効なエンティティを生成
            const inquiry = Inquiry.create(rawData);
            
            // 2. インフラストラクチャ層を利用してPub/Subに発行
            await this.publisher.publish(inquiry);

            return true; // 成功

        } catch (error) {
            // 検証エラーはそのままスロー (HTTPハンドラで400 Bad Requestに変換される)
            if (error instanceof ValidationError) {
                throw error;
            }
            // その他の発行エラーはログを記録して再スロー (HTTPハンドラで500 Internal Server Errorに変換される)
            console.error('SubmitInquiry execution failed:', error);
            throw new Error('サーバーエラーにより、お問い合わせの受付に失敗しました。');
        }
    }
}
