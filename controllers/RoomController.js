class RoomController {

    async index(req, res, next){
        res.render('home');
    }
    generateRandomRoomId() {
        const characters = 'abcdefghijklmnopqrstuvwxyz';
        const groupLength = 4; 
        const numGroups = 3;  
        let roomId = '';
      
        for (let i = 0; i < numGroups; i++) {
            let group = '';
            for (let j = 0; j < groupLength; j++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                group += characters[randomIndex];
            }
            roomId += group;
            if (i < numGroups - 1) {
                roomId += '-';
            }
        }
      
        return roomId;
    }
    createRoom = async (req, res, next) => {
        const roomId = this.generateRandomRoomId();

        req.flash('created', true);
      
        return res.redirect(roomId);
    }

    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    joinRoom = async (req, res, next) => {
        //check if room exists
        
        //check if owner
        const isRoomNewCreated = req.flash('created');
        if(isRoomNewCreated && isRoomNewCreated[0] == true){
           return res.render('index');
        }
        //
        res.render('prejoin');
    }

    joinRoomPOST = async (req, res, next) => {
        const roomId = req.params.roomId;
        const time = this.getCurrentTime();
        //check if room exists
        
        //check if owner
        
        //
        res.render('index');
    }

}

module.exports = new RoomController;