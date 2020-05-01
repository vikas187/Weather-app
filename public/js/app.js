console.log('Client side javascript has loaded');

document.querySelector('.form').addEventListener('submit', (event)=>{
    event.preventDefault();
    const input = document.querySelector('input').value;
    const messageOne = document.querySelector('#message-1');
    const messageTwo = document.querySelector('#message-2');
    messageOne.textContent = "Loading...";
    fetch(`http://127.0.0.1:3000/weather?address=${input}`, {headers:{'content-type': 'application/json'}}).then(response=>{
        //console.log(response);
        response.json().then(res=>{
            if(res.error) {
                //console.log(res.error);
                messageOne.textContent = res.error;
            } else {
                console.log(res.weather);
                console.log(res.location);
                messageOne.textContent = res.location;
                messageTwo.textContent = res.weather;
            }
        });
    });
})
