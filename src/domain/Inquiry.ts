// お問い合わせデータの構造
export interface InquiryData {
    name: string;
    email: string;
    message: string;
}

// ドメインエラー
export class DomainError extends Error {}
export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * お問い合わせエンティティ（値オブジェクト）
 * 責務：データのカプセル化と不変条件（バリデーション）の保証
 */
export class Inquiry {
    public readonly name: string;
    public readonly email: string;
    public readonly message: string;

    private constructor(data: InquiryData) {
        this.name = data.name.trim();
        this.email = data.email.trim();
        this.message = data.message.trim();
    }

    /**
     * ファクトリメソッド：データ検証を行い、有効なInquiryインスタンスを生成する
     * @param data フォームから送信された生データ
     * @returns Inquiryインスタンス
     */
    public static create(data: InquiryData): Inquiry {
        if (!data.name || data.name.length < 1) {
            throw new ValidationError('名前が入力されていません。');
        }
        if (!data.email || !Inquiry.isValidEmail(data.email)) {
            throw new ValidationError('無効なメールアドレス形式です。');
        }
        if (!data.message || data.message.length < 10) {
            throw new ValidationError('メッセージは10文字以上で入力してください。');
        }

        // 余分なプロパティが含まれないように、必要なプロパティのみでインスタンスを構築
        return new Inquiry({ 
            name: data.name, 
            email: data.email, 
            message: data.message 
        });
    }

    // 簡単なメールアドレス形式チェック
    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
