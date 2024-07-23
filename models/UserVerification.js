class UserVerification {
    constructor(id, userId, uniqueString, createdAt, expiredAt) {
        this.id = id;
        this.userId = userId;
        this.uniqueString = uniqueString;
        this.expiredAt = expiredAt;
        this.createdAt = createdAt;
    }
}

module.exports = UserVerification;