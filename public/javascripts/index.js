export async function toggleContainer(containerToShow, isActionContainerOpenGlobal) {
    isActionContainerOpenGlobal = !isActionContainerOpenGlobal;
    let isActionContainerOpen = false;
    const actionContainers = document.querySelectorAll('.action-container > div');
    if (actionContainer.classList.contains('open')) {
        isActionContainerOpen = true;
    }
    if (isActionContainerOpen) {
        let isThisContainerOpen = false;
        for (const container of actionContainers) {
            if (container.style.display === 'flex') {
                if (container === containerToShow) {
                    isThisContainerOpen = true;
                    break;
                }
            }
        }
        if (isThisContainerOpen) {
            actionContainer.classList.remove('open');
            setTimeout(() => {
                actionContainer.style.display = 'none';
                document.querySelector('.grid-container').classList.remove('reduced');
            }, 300);
        }
        else {
            actionContainers.forEach(container => {
                container.style.display = 'none';
            });
            containerToShow.style.display = 'flex';
        }
    }
    else {
        actionContainers.forEach(container => {
            container.style.display = 'none';
        });
        containerToShow.style.display = 'flex';
        actionContainer.style.display = 'block';
        setTimeout(() => {
            actionContainer.classList.toggle('open');
            document.querySelector('.grid-container').classList.toggle('reduced');
        }, 10);
    }
}
export function closeActionContainer() {
    isActionContainerOpenGlobal = false;
    actionContainer.classList.remove('open');
    setTimeout(() => {
        actionContainer.style.display = 'none';
        document.querySelector('.grid-container').classList.remove('reduced');
    }, 300);
};

export function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

$("#time").text(getCurrentTime());
setInterval(() => {
    $("#time").text(getCurrentTime());
}, 60000)


export async function addItem(id, name) {
    const itemIdExists = document.getElementById(id);
    if(itemIdExists){
        return;
    }
    const container = document.querySelector('.grid-container')
    const item = document.createElement('div');
    item.id = "divVideo"+id;
    item.classList.add('video-container');
    item.classList.add('grid-item');
    container.appendChild(item);

    const video = document.createElement('video')
    video.id = id
    video.autoplay = true
    video.playsInline = true
    item.appendChild(video)

    const nameDisplay = document.createElement('div');
    nameDisplay.classList.add('name-display');
    nameDisplay.innerText = name;
    item.appendChild(nameDisplay);

    const mutedMic = document.createElement('div');

    mutedMic.className = `mutedMic${id} d-none position-absolute top-0 end-0 muted-mic mt-2 me-2 text-white fs-5 bg-dark rounded-circle d-flex align-items-center justify-content-center`;

    const icon = document.createElement('i');
    icon.className = 'bi bi-mic-mute p-0';

    mutedMic.appendChild(icon);
    item.append(mutedMic);




    const divAlternative = document.createElement('div');
    divAlternative.classList.add("d-none");
    divAlternative.classList.add("bg-secondary");
    divAlternative.classList.add("grid-item");
    divAlternative.id = "divAlter" + id;
    container.appendChild(divAlternative);


    divAlternative.classList.add('video-container-altenative');
    divAlternative.classList.add('position-relative');
    // divAlternative.classList.add('d-none');
    const image = document.createElement('img');
    image.classList.add("user-avatar-display");
    image.classList.add("position-absolute");
    image.classList.add("top-50");
    image.classList.add("start-50");
    image.classList.add("translate-middle");
    // image.classList.add("d-flex");
    // image.classList.add("justify-content-center");
    // image.classList.add("align-items-center");
    image.src = 'https://assets.puzzlefactory.com/puzzle/566/423/original.jpg';
    divAlternative.appendChild(image);
    const nameDisplay2 = document.createElement('div');
    nameDisplay2.classList.add('name-display');
    nameDisplay2.innerText = name;
    divAlternative.appendChild(nameDisplay2);

    const muteMicClone = mutedMic.cloneNode(true);
    divAlternative.appendChild(muteMicClone);




    const num = container.childElementCount

    // if (num == 1) {
    //     item.addEventListener('click', () => {
    //         addItem()
    //     })
    // }
    // else if (num == 2) {
    //     item.addEventListener('click', () => {
    //         container.removeChild(container.lastChild)
    //         resizeVideo()
    //     })
    // }
    resizeVideo()
}


export function updateUserList(users, clientId) {
    const userListContainer = $("#userslist");
    userListContainer.empty();
    users.forEach(user => {
        if (user.id == clientId) {
            const userDiv = `
                <div class="row d-flex align-items-center pt-2 pb-2">
                                    <div class="col-2 avatar ps-3"><img class="user-avatar" src="https://th.bing.com/th/id/OIP.KTSVEqImOpx4gXTshphsnwHaHa?rs=1&pid=ImgDetMain" alt="" srcset=""></div>
                                    <div class="col-6 p-0 ps-3 ps-sm-1">${user.name} (You) </div>
                                    <div class="col-2 text-center"><i class="bi bi-mic-mute"></i></div>
                                    <div class="col-2 p-0">
                                        <button class="buttons buttonsClose">
                                            <i class="bi bi-three-dots-vertical fs-5"></i>
                                        </button>
                                    </div>
                                </div>
            `
            userListContainer.append(userDiv);
        }
        else {
            const userDiv = `
                <div class="row d-flex align-items-center pt-2 pb-2">
                                    <div class="col-2 avatar ps-3"><img class="user-avatar" src="https://th.bing.com/th/id/OIP.KTSVEqImOpx4gXTshphsnwHaHa?rs=1&pid=ImgDetMain" alt="" srcset=""></div>
                                    <div class="col-6 p-0 ps-3 ps-sm-1">${user.name} </div>
                                    <div class="col-2 text-center"><i class="bi bi-mic-mute"></i></div>
                                    <div class="col-2 p-0">
                                        <button class="buttons buttonsClose">
                                            <i class="bi bi-three-dots-vertical fs-5"></i>
                                        </button>
                                    </div>
                                </div>
            `
            userListContainer.append(userDiv);
        }

        $("#contributors-number").text(users.length);
    });
}

export function resizeVideo() {
    const container = document.querySelector('.grid-container');

    const videoContainer = document.querySelectorAll('.video-container');
    const num = videoContainer.length;
    const width = window.innerWidth;

    let columns = 1;
    let rows = 1;

    if (width > 1200) {
        if (num == 1) {
            columns = 1;
            rows = 1;
        }
        else if (num <= 4) {
            columns = 2;
            rows = Math.ceil(num / 2);
        } else if (num <= 9) {
            columns = 3;
            rows = Math.ceil(num / 3);
        } else if (num <= 16) {
            columns = 4;
            rows = Math.ceil(num / 4);
        } else if (num <= 25) {
            columns = 5;
            rows = Math.ceil(num / 5);
        } else {
            columns = 6;
            rows = Math.ceil(num / 6);
        }
    } else if (width > 800) {
        if (num == 1) {
            columns = 1;
            rows = 1;
        }
        else if (num <= 4) {
            columns = 2;
            rows = Math.ceil(num / 2);
        } else if (num <= 6) {
            columns = 3;
            rows = Math.ceil(num / 3);
        } else if (num <= 9) {
            columns = 3;
            rows = Math.ceil(num / 3);
        } else if (num <= 12) {
            columns = 4;
            rows = Math.ceil(num / 4);
        } else if (num <= 16) {
            columns = 4;
            rows = Math.ceil(num / 4);
        } else if (num <= 20) {
            columns = 5;
            rows = Math.ceil(num / 5);
        } else {
            columns = 5;
            rows = Math.ceil(num / 5);
        }
    } else {
        if (num == 1) {
            columns = 1;
            rows = 1;
        } else if (num <= 2) {
            columns = 1;
            rows = 2;
        } else if (num <= 4) {
            columns = 2;
            rows = Math.ceil(num / 2);
        } else if (num <= 6) {
            columns = 2;
            rows = Math.ceil(num / 2);
        } else if (num <= 9) {
            columns = 3;
            rows = Math.ceil(num / 3);
        } else if (num <= 12) {
            columns = 3;
            rows = Math.ceil(num / 3);
        } else if (num <= 16) {
            columns = 4;
            rows = Math.ceil(num / 4);
        } else {
            columns = 4;
            rows = Math.ceil(num / 4);
        }
    }

    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}


const actionContainer = document.getElementById('actionContainer');
const chatContainer = document.getElementById('chatContainer');
const chatButton = document.getElementById('chatButton');
const closeChatButton = document.getElementById('closeChatButton');
const closePeopleButton = document.getElementById('closePeopleButton');


const peopleButton = document.getElementById('peopleButton');
const peopleButtonOnMobile = document.getElementById('peopleButtonOnMobile');
const chatButtonOnMobile = document.getElementById('chatButtonOnMobile');
const peopleContainer = document.getElementById('peopleContainer');

let isActionContainerOpenGlobal = false;

peopleButton.addEventListener('click', function () {
    toggleContainer(peopleContainer, isActionContainerOpenGlobal);
});
peopleButtonOnMobile.addEventListener('click', function () {
    toggleContainer(peopleContainer, isActionContainerOpenGlobal);
});

chatButton.addEventListener('click', function () {
    toggleContainer(chatContainer, isActionContainerOpenGlobal);
});
chatButtonOnMobile.addEventListener('click', function () {
    toggleContainer(chatContainer, isActionContainerOpenGlobal);
});


closeChatButton.addEventListener('click', function () {
    closeActionContainer();
});
closePeopleButton.addEventListener('click', function () {
    closeActionContainer();
});


document.querySelector('.contributor').addEventListener('click', function () {
    const peopleInMeeting = document.querySelector('.people-in-meeting');
    if (peopleInMeeting.classList.contains('d-none')) {
        peopleInMeeting.classList.remove('d-none');
        document.querySelector('.contributor').classList.remove('rounded-bottom-2');
    }
    else {
        peopleInMeeting.classList.toggle('d-none');
        document.querySelector('.contributor').classList.add('rounded-bottom-2');
    }
});

window.addEventListener('resize', resizeVideo);