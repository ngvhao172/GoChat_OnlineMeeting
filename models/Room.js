class Room {
    constructor(id, roomId, roomName, creatorId, createdAt, startAt, endAt, daysOfWeek = [], specificDates = [], attendees = []) {
        this.id = id;
        this.roomId = roomId;
        this.roomName = roomName;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
        this.startAt = startAt;
        this.endAt = endAt;
        this.daysOfWeek = daysOfWeek;
        this.specificDates = specificDates;
        this.attendees = attendees
    }
}

module.exports = Room;