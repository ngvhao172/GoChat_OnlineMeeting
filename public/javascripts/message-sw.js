if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'push-notification') {
            const data = event.data.data;
            console.log("Received data from Service Worker:", data);
            const {from, roomId, to, fromUserAvatar} = data;
            if(to!=$("#userEmailHidden").val()){
                return;
            }

            const storedDataArrayString = localStorage.getItem('invitations');

            const storedDataArray = storedDataArrayString ? JSON.parse(storedDataArrayString) : [];

            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const formattedTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            const date = formattedDate
            const time = formattedTime

            storedDataArray.unshift({from, roomId, to, fromUserAvatar, date, time} );
            localStorage.setItem('invitations', JSON.stringify(storedDataArray));
            localStorage.setItem('newMessage', true);
        }
    });
}