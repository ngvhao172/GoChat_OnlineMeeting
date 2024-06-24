class Room {
    constructor(id, roomId, creatorId, createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
    }
}

module.exports = Room;