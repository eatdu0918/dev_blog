export class Mailer {
    send(email: string, message: string): boolean {
        // 실제로는 이메일을 발송하는 복잡한 로직이 있겠지만,
        // 테스트 환경에서는 이를 모방(Mock)할 대상입니다.
        console.log(`Sending email to ${email}: ${message}`);
        return true;
    }
}

export class NotificationService {
    constructor(private mailer: Mailer) {}

    notifyUser(userId: string, email: string, message: string): string {
        const success = this.mailer.send(email, message);
        if (success) {
            return `Notification sent to ${userId}`;
        }
        return `Failed to notify ${userId}`;
    }
}
