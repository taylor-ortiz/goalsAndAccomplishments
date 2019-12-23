import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const callbacks = {};

/**
 * Registers a callback for an event
 * @param {string} eventName - Name of the event to listen for.
 * @param {function} callback - Function to invoke when said event is fired.
 */
const register = (eventName, callback) => {
    if (!callbacks[eventName]) {
        callbacks[eventName] = new Set();
    }
    callbacks[eventName].add(callback);
};

/**
 * Unregisters a callback for an event
 * @param {string} eventName - Name of the event to unregister from.
 * @param {function} callback - Function to unregister.
 */
const unregister = (eventName, callback) => {
    if (callbacks[eventName]) {
        callbacks[eventName].delete(callback);
    }
};

/**
 * Fires an event to listeners.
 * @param {string} eventName - Name of the event to fire.
 * @param {*} payload - Payload of the event to fire.
 */
const fire = (eventName, payload) => {
    if (callbacks[eventName]) {
        callbacks[eventName].forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                // fail silently
            }
        });
    }
};

const configureCustomMessage = (userName, isAccomplishment) => {
    if (userName) {
        let name = userName.split(" ");
        let message = isAccomplishment ? 'Yearly Accomplishments' : 'Yearly Goals';
        return `${name[0]}'s ${message}`;
    } else {
        return `--- ${message}`;
    }
}

var goalObj = function(id, goalIndex, accomplishIndex, salesforceId, goal, status, submitted, removal, accomplished, accomplishmentSFId) {
        this.id = id;
        this.goalIndex = goalIndex;
        this.accomplishIndex = accomplishIndex;
        this.salesforceId = salesforceId;
        this.goal = goal;
        this.status = status;
        this.submitted = submitted;
        this.removal = removal;
        this.accomplished = accomplished;
        this.accomplishmentSFId = accomplishmentSFId;
}

const handleToastEvent = (title, message, variant, mode) => {
    return new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
        mode: mode
    })
}

const successMessages = () => {
    const arr = ['You rock! Way to set goals!',
                 'Congrats! You are on your way!', 
                 'Awesome! Goals look good on you!', 
                 'Sweet! Your boss is going to be so impressed!'];
    return arr[Math.floor(Math.random() * arr.length)];
}

export { configureCustomMessage, goalObj, handleToastEvent, successMessages, register, unregister, fire }

