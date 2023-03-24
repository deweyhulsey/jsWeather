function toDateTime(time) {
    return new Date(time).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'});
}

function toDate(time) {
    return new Date(time).toLocaleDateString();
}

function toTime(time) {
    return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toTemp(temperature) {
    let temp = [];
    temp.f = temperature + 'F';
    temp.c = ((temperature - 32) * 5/9).toFixed(1) + 'C';
    return temp;
}

export { toDateTime, toTime, toDate, toTemp };