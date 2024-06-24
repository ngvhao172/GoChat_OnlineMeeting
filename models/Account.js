class Account {
    constructor(id, userId, userEmail, password, verified, enabled, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.userEmail = userEmail;
        this.password = password;
        this.verified = verified;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
module.exports = Account;