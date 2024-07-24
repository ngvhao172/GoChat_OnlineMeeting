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
            $(".main-container").removeClass("expanded");
        }
        else {
            actionContainers.forEach(container => {
                container.style.display = 'none';
            });
            containerToShow.style.display = 'flex';
        }
    }
    else {
        $(".main-container").addClass("expanded");
        actionContainers.forEach(container => {
            container.style.display = 'none';
        });
        containerToShow.style.display = 'flex';
        // actionContainer.style.display = 'block';
        setTimeout(() => {
            actionContainer.classList.toggle('open');
            // document.querySelector('.grid-container').classList.toggle('reduced');
        }, 10);
    }
}
export function closeActionContainer() {
    isActionContainerOpenGlobal = false;
    actionContainer.classList.remove('open');
    $(".main-container").removeClass("expanded");
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
}, 30000)


export async function addItem(id, name, avatar) {
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
    video.classList.add('default-border-class-video');
    video.id = id
    video.autoplay = true
    if(id == "localVideo"){
        video.muted = true
    }
    video.playsInline = true
    item.appendChild(video)

    const nameDisplay = document.createElement('div');
    nameDisplay.classList.add('name-display');
    nameDisplay.classList.add('me-1');
    nameDisplay.innerText = name;
    item.appendChild(nameDisplay);

    const mutedMic = document.createElement('div');

    mutedMic.className = `mutedMic${id} d-none position-absolute top-0 end-0 muted-mic mt-2 me-2 text-white fs-5 bg-dark rounded-circle d-flex align-items-center justify-content-center`;

    const icon = document.createElement('i');
    icon.className = 'bi bi-mic-mute p-0';

    mutedMic.appendChild(icon);
    item.append(mutedMic);

    const micActive = document.createElement('div');

    micActive.className = `micActive${id} d-none mic-container position-absolute top-0 end-0 muted-mic mt-2 me-2 text-white fs-5 rounded-circle d-flex align-items-center justify-content-center`;
    micActive.innerHTML = `
        <div class="dot rounded-pill"></div>
        <div class="dot rounded-pill"></div>
        <div class="dot rounded-pill"></div>
    `;
    item.append(micActive);




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
    if(avatar){
        image.src = avatar;
    }else{
        image.src = "/images/GoLogoNBg.png";
    }
    divAlternative.appendChild(image);
    const nameDisplay2 = document.createElement('div');
    nameDisplay2.classList.add('name-display');
    nameDisplay2.classList.add('me-1');
    nameDisplay2.innerText = name;
    divAlternative.appendChild(nameDisplay2);

    const muteMicClone = mutedMic.cloneNode(true);
    divAlternative.appendChild(muteMicClone);


    const micActiveClone = micActive.cloneNode(true);
    divAlternative.appendChild(micActiveClone);




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


export function addOtherUsersUIDiv(){
    const itemIdExists = document.getElementById("divOtherUsers");
    if(itemIdExists){
        return;
    }
    const container = document.querySelector('.grid-container')

    const divAlternative = document.createElement('div');
    divAlternative.classList.add("bg-secondary");
    divAlternative.classList.add("grid-item");
    divAlternative.id = "divOtherUsers";
    container.appendChild(divAlternative);

    divAlternative.classList.add('video-container');
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
    image.src = './images/GoLogoNBg.png';
    divAlternative.appendChild(image);
    const nameDisplay2 = document.createElement('div');
    nameDisplay2.classList.add('name-display');
    nameDisplay2.classList.add('me-1');
    nameDisplay2.innerText = "5 other users";
    divAlternative.appendChild(nameDisplay2);
    resizeVideo();

    // moveDivToPosition("divOtherUsers", 3);

    divAlternative.addEventListener("click", function () {
        toggleContainer(peopleContainer, isActionContainerOpenGlobal);
    });
}
export function removeOtherUsersDiv(){
    const itemIdExists = document.getElementById("divOtherUsers");
    if(itemIdExists){
        itemIdExists.remove();
    }
}


export function updateDots(volume, userId) {
    // console.log(userId);
    const dotsContainers = document.getElementsByClassName("micActive" + userId);
    for (const container of dotsContainers) {
        const dots = container.querySelectorAll('.dot');

        const normalizedVolume = Math.max(0, Math.min((volume + 100) / 1, 100));
        const height = (normalizedVolume / 10) + 5;
        dots[0].style.height = `${height}px`;
        dots[1].style.height =  (height == 5)? `${height}px` : `${height + 5}px`;
        dots[2].style.height = `${height}px`;
    }
}


export function stopDots(userId) {
    const dotsContainers = document.getElementsByClassName("micActive"+userId);
    for (const container of dotsContainers) {
        container.classList.add("d-none");
    };
    const videoItem = document.getElementById(userId);
    const divAlter = document.getElementById("divAlter"+userId);
    if(videoItem){
        videoItem.classList.remove('custom-border-class');
        videoItem.classList.add('default-border-class-video');
    }
    if(divAlter){
        divAlter.classList.remove('custom-border-class');
        divAlter.classList.add('default-border-class-video');
    }
}
export function showDots(userId) {
    const dotsContainers = document.getElementsByClassName("micActive"+userId);
    for (const container of dotsContainers) {
        container.classList.remove("d-none");
    };

    const videoItem = document.getElementById(userId);
    if(videoItem){
        videoItem.classList.remove('default-border-class-video');
    videoItem.classList.add('custom-border-class');
    }
    const divAlter = document.getElementById("divAlter"+userId);
    if(divAlter){
        divAlter.classList.remove('default-border-class-video');
        divAlter.classList.add('custom-border-class');
    }
    
}



export function filterUsersByName(nameFilter) {
    if(nameFilter.length == 0){
        const users = document.querySelectorAll('.contributor-showing');
        users.forEach(user => {
            user.classList.remove('d-none');
        });
        return;
    }
    const users = document.querySelectorAll('.contributor-showing');
    users.forEach(user => {
        const userName = user.getAttribute('data-name').toLowerCase();
        if (userName.includes(nameFilter.toLowerCase())) {
            user.classList.remove('d-none');
        } else {
            user.classList.add('d-none');
        }
    });
}



export function updateUserList({users, clientId, filter, idUserLeft, ownerId}) {
    const userListContainer = $("#userslist");
    if(idUserLeft){
        let userLeft = document.getElementById(`contributor-${idUserLeft}`);
        if(userLeft){
            userLeft.remove();
            return;
        }

    }
    users.forEach(user => {
        let existedUser = document.getElementById(`contributor-${user.id}`);

        if (!existedUser) {
            const userDiv = `
                <div class="row d-flex align-items-center pt-2 pb-2 contributor-showing" data-name="${user.name}" id="contributor-${user.id}">
                    <div class="col-2 avatar"><img class="user-avatar" src="${user.avatar ? user.avatar: '/images/GoLogoNBg.png'}" alt="" srcset=""></div>
                    <div class="col-6 p-0 fs-6 ps-2"><span>${user.name}${user.id === clientId ? ' (You) ' : '' } ${user.id === ownerId ? "<span class='fw-bold fs-6'>(Host)</span>" : ''}</span></div>
                    <div class="col-2 text-center d-none mutedMic${user.id === clientId ? 'localVideo' : user.id}"><i class="bi bi-mic-mute"></i></div>
                    <div class="col-2 text-center d-none micActive${user.id === clientId ? 'localVideo' : user.id}">
                        <div class="mic-container muted-mic text-white fs-5 rounded-circle d-flex align-items-center justify-content-center">
                            <div class="dot rounded-pill"></div>
                            <div class="dot rounded-pill"></div>
                            <div class="dot rounded-pill"></div>
                        </div>
                    </div>
                    <div class="ms-auto col-2 p-0">
                        <button class="buttons buttonsClose">
                            <i class="bi bi-three-dots-vertical fs-5"></i>
                        </button>
                    </div>
                </div>
            `;
            userListContainer.append(userDiv);
            if(user.id == clientId){
                moveDivToPositionGlobal(`contributor-${user.id}`,1);
            }
        }
    });

    $("#contributors-number").text(users.length);
    $("#contributors-text-show").text(users.length);
}

export function resizeSharing(){
    const container = document.querySelector('.sharing-container');

    const sharingVideoContainer = document.querySelectorAll('.sharing-video-container');
    const num = sharingVideoContainer.length;

    if(num > 0){
        container.classList.add("col-9");
    }
    else{
        container.classList.remove("col-9");
    }
    const width = window.innerWidth;

    // console.log(width);

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

export function resizeVideo() {
    const container = document.querySelector('.grid-container');

    const videoContainer = document.querySelectorAll('.video-container');
    const num = videoContainer.length;
    const width = window.innerWidth;

    // console.log(width);

    const sharingContainer = document.querySelector('.sharing-container');
    if(!sharingContainer.classList.contains("d-none")){
        container.classList.add("col-3");
        let columns = 1;
        let rows = 1;
        if(num > 4){
            $(".grid-container").addClass("hide-extra");
            // addOtherUsersUIDiv();
            // moveDivToPosition("divOtherUsers", 7);
            rows = Math.ceil(4);
        }
        else{
            rows = Math.ceil(num);
        }
        // if (num <= 2) {
        //     columns = 1;
        //     rows = 2;
        // } else if (num <= 4) {
        //     rows = Math.ceil(num / 2);
        // } else if (num <= 6) {
        //     rows = Math.ceil(num / 2);
        // } else if (num <= 9) {
        //     rows = Math.ceil(num / 3);
        // } else if (num <= 12) {
        //     rows = Math.ceil(num / 3);
        // } else if (num <= 16) {
        //     rows = Math.ceil(num / 4);
        // } else {
        //     rows = Math.ceil(num / 4);
        // }

        container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        return;
    }
    else{
        container.classList.remove("col-3");
    }

    $(".grid-container").removeClass("hide-extra");

    let columns = 1;
    let rows = 1;

    removeOtherUsersDiv();

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
            addOtherUsersUIDiv();
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
            addOtherUsersUIDiv();
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
        } else{
            addOtherUsersUIDiv();
        }
    }

    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}


const actionContainer = document.getElementById('actionContainer');

const chatContainer = document.getElementById('chatContainer');
const chatButton = document.getElementById('chatButton');
const chatButtonOnMobile = document.getElementById('chatButtonOnMobile');

const closeChatButton = document.getElementById('closeChatButton');
const closePeopleButton = document.getElementById('closePeopleButton');
const closeControlButton = document.getElementById('closeControlButton');

const peopleContainer = document.getElementById('peopleContainer');
const peopleButton = document.getElementById('peopleButton');
const peopleButtonOnMobile = document.getElementById('peopleButtonOnMobile');


const controlContainer = document.getElementById('controlContainer');
const controlButton = document.getElementById('controlButton');
const controlButtonOnMobile = document.getElementById('controlButtonOnMobile');

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

if(controlButton){
    controlButton.addEventListener('click', function () {
        toggleContainer(controlContainer, isActionContainerOpenGlobal);
    });
}

if(controlButtonOnMobile){
    controlButtonOnMobile.addEventListener('click', function () {
        toggleContainer(controlContainer, isActionContainerOpenGlobal);
    });
}

closeChatButton.addEventListener('click', function () {
    closeActionContainer();
});
closePeopleButton.addEventListener('click', function () {
    closeActionContainer();
});

if(closeControlButton){
    closeControlButton.addEventListener('click', function () {
        closeActionContainer();
    });
}

// $(document).ready(function() {
   
// });



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

export function moveDivToPosition(divId, position) {
    var div = document.getElementById("divVideo" + divId);
    var alterDiv = document.getElementById("divAlter" + divId);
    var parent = div.parentNode;

    let targetIndex = Math.min(position, parent.children.length - 1);

    if (parent.children[targetIndex] === div && parent.children[targetIndex + 1] === alterDiv) {
        return;
    }

    parent.insertBefore(div, parent.children[targetIndex]);
    parent.insertBefore(alterDiv, parent.children[targetIndex + 1]);
}

export function moveDivToPositionGlobal(divId, position) {
    var div = document.getElementById(divId);
    var parent = div.parentNode;

    let targetIndex = Math.min(position, parent.children.length - 1);

    if (parent.children[targetIndex] === div) {
        return;
    }

    parent.insertBefore(div, parent.children[targetIndex]);
}


export function moveDivToPositionWhenSpeaking(divId) {
    let position = 0;
    if (divId == "localVideo") {
        return;
    }
    // Sharing => day len vi tri thu 3
    if ($(".grid-container").hasClass("hide-extra")) {
        position = 3 * 2 - 2;
    } else {
        position = 2 * 2 - 2;
    }
    // Không sharing => day len vi tri thu 2

    var div = document.getElementById("divVideo" + divId);
    var alterDiv = document.getElementById("divAlter" + divId);
    var parent = div.parentNode;

    let targetIndex = Math.min(position, parent.children.length - 1);

    console.log(targetIndex);

    console.log(parent.children[targetIndex + 1] === alterDiv);
    console.log(parent.children[targetIndex] === div);

    if (parent.children[targetIndex] === div && parent.children[targetIndex + 1] === alterDiv) {
        return;
    }

    parent.insertBefore(div, parent.children[targetIndex]);
    parent.insertBefore(alterDiv, parent.children[targetIndex + 1]);
}

export function removeRequestorUi(id){
    const requestDIV = document.getElementById("requestor-"+id);
    if(requestDIV){
        requestDIV.remove();
        updateRequestorListUI();
    }
}

export function updateRequestorListUI(){
    const requestorsList = document.querySelectorAll(".requestorsContainer");
    const videoContainer = document.querySelectorAll('.requestor-container');
    const num = videoContainer.length;
    if(num > 0){
        requestorsList.forEach(div => {
            div.classList.remove("d-none");
        })
    }
    else{
        requestorsList.forEach(div => {
            div.classList.add("d-none");
        })
    }
}


window.addEventListener('resize', resizeVideo);



