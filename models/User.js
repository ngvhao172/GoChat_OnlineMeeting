class User {
    constructor(id, userEmail, fullName, phoneNumber, address, dob, avatar, gender, createdAt, updatedAt) {
        this.id = id;
        this.userEmail = userEmail;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.dob = dob;
        this.avatar = avatar;
        this.gender = gender;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.role = 'User'
    }
}

module.exports = User;