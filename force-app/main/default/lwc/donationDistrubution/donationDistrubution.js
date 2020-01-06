import { LightningElement, api, track } from 'lwc';

const DELAY = 300;

export default class DonationDistrubution extends LightningElement {
    @api name;
    @api itemIndex;
    @api donationAmount;

    oldVal;
    newVal;
    
    handleDonationInput(event) {

        if (this.delayTimeout) {
            window.clearTimeout(this.delayTimeout);
        }
        this.newVal = event.target.value;
        this.donationAmount = event.target.value;
        this.delayTimeout = setTimeout(() => {
            let [oldValue, newValue] = this.cleanAmountValues(this.oldVal, this.newVal);
            console.log('what is old value? ', oldValue);
            console.log('what is new value? ', newValue);
            // Prevents the anchor element from navigating to a URL.
            event.preventDefault();

            // Creates the event with the contact ID data.
            const selectedEvent = new CustomEvent('donationchange', { detail: { newVal: newValue,
                                                                                index: this.itemIndex,
                                                                                absent: newValue === 0 ? true : false}
                                                                    });

            this.dispatchEvent(selectedEvent);

            this.oldVal = newValue;
        }, DELAY);
    }

    cleanAmountValues(oldVal, newVal) {
        if (typeof oldVal === 'undefined') {
            oldVal = 0;
        } else if (typeof newVal === 'undefined') {
            newVal = 0;
        }
        return [Number(oldVal), Number(newVal)];
    }
}